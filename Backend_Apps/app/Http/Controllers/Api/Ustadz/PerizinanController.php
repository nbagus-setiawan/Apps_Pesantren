<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Perizinan;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PerizinanController extends Controller
{
    /** Hanya ustadz dengan penugasan aktif jenis 'perizinan' yang boleh memproses */
    private function pastikanBerwenang(Request $request): void
    {
        if (! $request->user()->punyaTugasAktif('perizinan')) {
            throw ValidationException::withMessages([
                'authorization' => ['Anda bukan Penanggung Jawab Perizinan yang ditunjuk.'],
            ]);
        }
    }

    public function index(Request $request)
    {
        $this->pastikanBerwenang($request);

        return response()->json(
            Perizinan::with(['santri', 'diajukanOleh'])
                ->when($request->status, fn ($q) => $q->where('status', $request->status))
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }

    public function proses(Request $request, Perizinan $perizinan)
    {
        $this->pastikanBerwenang($request);

        $data = $request->validate([
            'status' => ['required', 'in:disetujui,ditolak'],
            'catatan' => ['nullable', 'string'],
        ]);

        $perizinan->update([
            ...$data,
            'diproses_oleh' => $request->user()->id,
        ]);

        if ($data['status'] === 'disetujui') {
            $perizinan->buatKodeQr(); // generate QR untuk penjemputan, berlaku 24 jam
        }

        return response()->json($perizinan);
    }

    /** Scan QR saat penjemputan santri di gerbang */
    public function scanQr(Request $request)
    {
        $data = $request->validate(['kode_qr' => ['required', 'string']]);

        $perizinan = Perizinan::where('kode_qr', $data['kode_qr'])->first();

        if (! $perizinan || ! $perizinan->qrMasihBerlaku()) {
            return response()->json(['message' => 'Kode QR tidak valid atau sudah kedaluwarsa.'], 422);
        }

        $perizinan->update(['qr_digunakan_at' => now()]);

        return response()->json(['message' => 'Verifikasi berhasil.', 'santri' => $perizinan->santri]);
    }
}
