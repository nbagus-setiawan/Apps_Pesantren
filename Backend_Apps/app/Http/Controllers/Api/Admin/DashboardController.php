<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Kelas;
use App\Models\Pelanggaran;
use App\Models\Perizinan;
use App\Models\Santri;
use App\Models\Tagihan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * PRD v1.4 §4.1: "Dashboard ringkasan: jumlah santri aktif, kehadiran hari
 * ini, tagihan belum lunas, dsb."
 *
 * DESAIGN.md §5.5: dashboard admin idealnya juga menampilkan "grafik donat
 * (sebaran per kelas/asrama)" dan "tabel aktivitas terbaru". Sebelumnya
 * response hanya berisi stat cards + breakdown kehadiran/keuangan — belum
 * ada data untuk dua komponen visual tersebut, jadi frontend tidak bisa
 * merendernya walau sudah didesain.
 *
 * PERBAIKAN: tambahkan dua key baru di response:
 *   - sebaran_kelas: jumlah santri aktif per kelas (untuk grafik donat)
 *   - aktivitas_terbaru: 10 event terakhir lintas modul (absensi alpa,
 *     tagihan baru, pengajuan izin), diurutkan terbaru dulu (untuk tabel
 *     aktivitas terbaru)
 *
 * Kedua data ini murni read-only/agregasi, tidak mengubah kontrak lama —
 * key lama (santri, kehadiran_hari_ini, keuangan, perizinan_pending,
 * generated_at) tetap sama persis, jadi tidak ada breaking change untuk
 * konsumen yang sudah ada.
 */
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $summary = Cache::remember('admin-dashboard-summary', 60, function () {
            $today = now()->toDateString();

            $totalSantriAktif = Santri::where('status', 'aktif')->count();

            $absensiHariIni = Absensi::whereDate('tanggal', $today)
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            $santriBelumDiabsen = $totalSantriAktif - $absensiHariIni->sum();

            $tagihanBelumLunas = Tagihan::whereIn('status', ['belum_bayar', 'telat'])->count();
            $tagihanMenungguVerifikasi = Tagihan::where('status', 'menunggu_verifikasi')->count();
            $totalNominalBelumLunas = Tagihan::whereIn('status', ['belum_bayar', 'telat'])->sum('nominal');

            $perizinanPending = Perizinan::where('status', 'pending')->count();

            // Sebaran santri aktif per kelas — dipakai frontend untuk
            // render grafik donat. Kelas tanpa santri aktif difilter agar
            // grafik tidak dipenuhi irisan bernilai 0.
            $sebaranKelas = Kelas::withCount(['santri' => function ($q) {
                $q->where('status', 'aktif');
            }])
                ->orderByDesc('id')
                ->get()
                ->map(fn ($k) => [
                    'kelas_id' => $k->id,
                    'nama' => $k->nama,
                    'jumlah_santri' => $k->santri_count,
                ])
                ->filter(fn ($row) => $row['jumlah_santri'] > 0)
                ->values();

            // Aktivitas terbaru: gabungan 5 absensi-alpa terbaru, 5 tagihan
            // terbaru, dan 5 pengajuan izin terbaru, disortir ulang lintas
            // sumber lalu diambil 10 teratas — supaya tabel tidak didominasi
            // satu jenis event saja kalau salah satu modul jauh lebih aktif.
            $aktivitasTerbaru = collect()
                ->merge(
                    Absensi::with('santri')
                        ->where('status', 'alpa')
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(fn ($a) => [
                            'tipe' => 'absensi',
                            'deskripsi' => ($a->santri->nama ?? 'Santri') . ' tercatat alpa',
                            'waktu' => $a->created_at,
                        ])
                )
                ->merge(
                    Tagihan::with('santri')
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(fn ($t) => [
                            'tipe' => 'tagihan',
                            'deskripsi' => 'Tagihan baru untuk ' . ($t->santri->nama ?? 'santri') . ' (periode ' . $t->periode . ')',
                            'waktu' => $t->created_at,
                        ])
                )
                ->merge(
                    Perizinan::with('santri')
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(fn ($p) => [
                            'tipe' => 'perizinan',
                            'deskripsi' => 'Pengajuan izin ' . ($p->santri->nama ?? 'santri') . ' — status ' . $p->status,
                            'waktu' => $p->created_at,
                        ])
                )
                ->merge(
                    Pelanggaran::with('santri')
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(fn ($pl) => [
                            'tipe' => 'pelanggaran',
                            'deskripsi' => 'Pelanggaran dicatat untuk ' . ($pl->santri->nama ?? 'santri') . ' (+' . $pl->poin_saat_itu . ' poin)',
                            'waktu' => $pl->created_at,
                        ])
                )
                ->sortByDesc('waktu')
                ->take(10)
                ->values()
                ->map(fn ($row) => [
                    'tipe' => $row['tipe'],
                    'deskripsi' => $row['deskripsi'],
                    'waktu' => $row['waktu']?->toIso8601String(),
                ]);

            return [
                'santri' => [
                    'aktif' => $totalSantriAktif,
                ],
                'kehadiran_hari_ini' => [
                    'hadir' => (int) ($absensiHariIni['hadir'] ?? 0),
                    'sakit' => (int) ($absensiHariIni['sakit'] ?? 0),
                    'izin' => (int) ($absensiHariIni['izin'] ?? 0),
                    'alpa' => (int) ($absensiHariIni['alpa'] ?? 0),
                    'belum_diabsen' => max(0, $santriBelumDiabsen),
                ],
                'keuangan' => [
                    'tagihan_belum_lunas' => $tagihanBelumLunas,
                    'tagihan_menunggu_verifikasi' => $tagihanMenungguVerifikasi,
                    'total_nominal_belum_lunas' => (float) $totalNominalBelumLunas,
                ],
                'perizinan_pending' => $perizinanPending,
                'sebaran_kelas' => $sebaranKelas,
                'aktivitas_terbaru' => $aktivitasTerbaru,
                'generated_at' => now()->toIso8601String(),
            ];
        });

        return response()->json($summary);
    }
}