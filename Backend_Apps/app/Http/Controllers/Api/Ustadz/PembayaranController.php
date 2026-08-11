<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PembayaranController extends Controller
{
    /** Hanya ustadz dengan penugasan aktif jenis 'keuangan' yang boleh verifikasi */
    private function pastikanBerwenang(Request $request): void
    {
        if (! $request->user()->punyaTugasAktif('keuangan')) {
            throw ValidationException::withMessages([
                'authorization' => ['Anda bukan Petugas Keuangan yang ditunjuk.'],
            ]);
        }
    }

    public function index(Request $request)
    {
        $this->pastikanBerwenang($request);

        return response()->json(
            Pembayaran::with(['tagihan.santri', 'dibayarOleh'])
                ->where('status', 'pending')
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }

    /**
     * PERBAIKAN: dibungkus DB::transaction() (sudah sebelumnya) DAN
     * sekarang menangani kasus status 'ditolak'.
     *
     * Sebelumnya, saat petugas keuangan menolak bukti transfer, kode hanya
     * meng-update Pembayaran::status menjadi 'ditolak' tanpa menyentuh
     * Tagihan::status sama sekali. Karena alur upload (lihat
     * WaliSantri\TagihanController::bayar()) selalu mengubah tagihan ke
     * 'menunggu_verifikasi' saat bukti diupload, tagihan yang bukti
     * bayarnya ditolak akan "nyangkut" selamanya di status
     * 'menunggu_verifikasi' — tidak pernah kembali ke 'belum_bayar'/'telat'.
     *
     * Dampaknya:
     * - App\Console\Commands\TandaiTagihanTelat sengaja skip status ini,
     *   jadi tagihan ini tidak akan pernah ditandai telat walau jatuh
     *   tempo sudah lama lewat.
     * - Dashboard admin (tagihan_belum_lunas) tidak menghitungnya karena
     *   hanya menghitung status belum_bayar/telat.
     * - Wali tidak mendapat sinyal jelas bahwa ia perlu upload ulang.
     *
     * Sekarang: saat status = 'ditolak', tagihan dikembalikan ke
     * 'belum_bayar' jika belum jatuh tempo, atau 'telat' jika jatuh tempo
     * sudah lewat — supaya wali langsung tahu tagihan itu perlu ditindak
     * lanjuti dan sistem housekeeping (TandaiTagihanTelat) bisa jalan
     * normal lagi untuk tagihan ini.
     */
    public function verifikasi(Request $request, Pembayaran $pembayaran)
    {
        $this->pastikanBerwenang($request);

        $data = $request->validate([
            'status' => ['required', 'in:diverifikasi,ditolak'],
            'catatan_petugas' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($pembayaran, $data, $request) {
            $pembayaran->update([
                ...$data,
                'diverifikasi_oleh' => $request->user()->id,
            ]);

            $tagihan = $pembayaran->tagihan;

            if ($data['status'] === 'diverifikasi') {
                $tagihan->update(['status' => 'lunas']);

                return;
            }

            // status === 'ditolak' — kembalikan tagihan ke status yang
            // mencerminkan kondisi sebenarnya (belum dibayar / sudah telat),
            // bukan dibiarkan tetap 'menunggu_verifikasi'.
            $statusBaru = $tagihan->jatuh_tempo && $tagihan->jatuh_tempo->isPast()
                ? 'telat'
                : 'belum_bayar';

            $tagihan->update(['status' => $statusBaru]);
        });

        return response()->json($pembayaran->fresh());
    }
}