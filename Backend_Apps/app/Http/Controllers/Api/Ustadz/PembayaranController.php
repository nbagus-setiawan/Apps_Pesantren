<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use Illuminate\Http\Request;
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

    public function verifikasi(Request $request, Pembayaran $pembayaran)
    {
        $this->pastikanBerwenang($request);

        $data = $request->validate([
            'status' => ['required', 'in:diverifikasi,ditolak'],
            'catatan_petugas' => ['nullable', 'string'],
        ]);

        $pembayaran->update([
            ...$data,
            'diverifikasi_oleh' => $request->user()->id,
        ]);

        if ($data['status'] === 'diverifikasi') {
            $pembayaran->tagihan->update(['status' => 'lunas']);
        }

        return response()->json($pembayaran);
    }
}
