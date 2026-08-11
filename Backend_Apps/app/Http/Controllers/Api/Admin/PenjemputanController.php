<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Perizinan;
use Illuminate\Http\Request;

/**
 * Log penjemputan santri via QR (PRD §4.1 "Penjemputan (QR Code)").
 * Data log sebenarnya sudah tersimpan di tabel `perizinan` sendiri
 * (kode_qr, qr_berlaku_sampai, qr_digunakan_at) — tidak perlu tabel baru.
 */
class PenjemputanController extends Controller
{
    /** Daftar QR yang sudah dipakai (log penjemputan), plus yang masih menunggu discan */
    public function index(Request $request)
    {
        return response()->json(
            Perizinan::with(['santri', 'diajukanOleh'])
                ->whereNotNull('kode_qr')
                ->when($request->status, function ($q) use ($request) {
                    if ($request->status === 'sudah_digunakan') {
                        $q->whereNotNull('qr_digunakan_at');
                    } elseif ($request->status === 'belum_digunakan') {
                        $q->whereNull('qr_digunakan_at');
                    }
                })
                ->latest('qr_berlaku_sampai')
                ->paginate($request->integer('per_page', 20))
                ->through(fn ($p) => [
                    'id' => $p->id,
                    'santri' => $p->santri?->nama,
                    'diajukan_oleh' => $p->diajukanOleh?->name,
                    'kode_qr' => $p->kode_qr,
                    'qr_berlaku_sampai' => $p->qr_berlaku_sampai,
                    'qr_digunakan_at' => $p->qr_digunakan_at,
                    'status' => $p->qr_digunakan_at
                        ? 'sudah_digunakan'
                        : ($p->qrMasihBerlaku() ? 'menunggu' : 'kedaluwarsa'),
                ])
        );
    }
}