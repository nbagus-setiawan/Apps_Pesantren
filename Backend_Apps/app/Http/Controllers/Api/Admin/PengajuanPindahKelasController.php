<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PengajuanPindahKelas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PengajuanPindahKelasController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            PengajuanPindahKelas::with(['santri', 'kelasTujuan', 'diajukanOleh'])
                ->when($request->status, fn ($q) => $q->where('status', $request->status))
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }

    /**
     * Setujui/tolak pengajuan. Jika disetujui, otomatis eksekusi pindah kelas + histori.
     *
     * PERBAIKAN: dibungkus DB::transaction(), mengikuti pola yang sudah
     * diterapkan di KamarController::pindahkanSantri() dan
     * SantriController::pindahKelas(). Sebelumnya, saat status disetujui,
     * tiga operasi (update pengajuan, tutup riwayat_kelas lama, buat
     * riwayat_kelas baru, update santri.kelas_id) berjalan sebagai query
     * terpisah tanpa transaction. Kalau terjadi error di tengah jalan,
     * pengajuan bisa sudah tercatat "disetujui" padahal riwayat_kelas
     * atau santri.kelas_id belum ter-update, sehingga data pindah kelas
     * jadi tidak konsisten dan status pengajuan tidak lagi merefleksikan
     * kondisi santri yang sebenarnya.
     */
    public function proses(Request $request, PengajuanPindahKelas $pengajuan)
    {
        $data = $request->validate([
            'status' => ['required', 'in:disetujui,ditolak'],
            'catatan' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($pengajuan, $data, $request) {
            $pengajuan->update([
                ...$data,
                'diproses_oleh' => $request->user()->id,
            ]);

            if ($data['status'] === 'disetujui') {
                $santri = $pengajuan->santri;

                $santri->riwayatKelas()->whereNull('tanggal_selesai')->update(['tanggal_selesai' => now()]);

                $santri->riwayatKelas()->create([
                    'kelas_id' => $pengajuan->kelas_tujuan_id,
                    'tahun_ajaran_id' => $pengajuan->tahun_ajaran_id,
                    'tanggal_mulai' => now(),
                    'keterangan' => $pengajuan->keterangan ?? 'Pindah kelas (via pengajuan ustadz)',
                    'dipindahkan_oleh' => $request->user()->id,
                ]);

                $santri->update(['kelas_id' => $pengajuan->kelas_tujuan_id]);
            }
        });

        return response()->json($pengajuan->fresh(['santri', 'kelasTujuan']));
    }
}