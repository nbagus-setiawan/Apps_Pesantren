<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Perizinan;
use App\Models\Santri;
use App\Models\Tagihan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * PRD v1.4 §4.1: "Dashboard ringkasan: jumlah santri aktif, kehadiran hari
 * ini, tagihan belum lunas, dsb."
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
                'generated_at' => now()->toIso8601String(),
            ];
        });

        return response()->json($summary);
    }
}
