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
     * PERBAIKAN: dibungkus DB::transaction(). Sebelumnya update
     * Pembayaran::status dan Tagihan::status (jika diverifikasi) berjalan
     * sebagai dua query terpisah tanpa transaction. Kalau terjadi error
     * di antara keduanya, pembayaran bisa sudah tercatat 'diverifikasi'
     * padahal tagihan terkait masih berstatus lama (mis. 'belum_bayar'
     * atau 'menunggu_verifikasi') — membuat wali santri melihat status
     * yang saling bertentangan antara riwayat pembayaran dan tagihan.
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

            if ($data['status'] === 'diverifikasi') {
                $pembayaran->tagihan->update(['status' => 'lunas']);
            }
        });

        return response()->json($pembayaran->fresh());
    }
}