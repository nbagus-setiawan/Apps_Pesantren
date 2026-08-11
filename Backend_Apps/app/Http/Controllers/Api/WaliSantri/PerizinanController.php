<?php

namespace App\Http\Controllers\Api\WaliSantri;

use App\Http\Controllers\Controller;
use App\Models\Perizinan;
use Illuminate\Http\Request;

class PerizinanController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Perizinan::where('diajukan_oleh', $request->user()->id)->latest()->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $santriIds = $request->user()->anak()->pluck('santri.id');

        $data = $request->validate([
            'santri_id' => ['required', 'in:' . $santriIds->implode(',')],
            'jenis' => ['required', 'in:sakit,izin_pulang,keperluan_lain'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'alasan' => ['required', 'string'],
        ]);

        $data['diajukan_oleh'] = $request->user()->id;
        $data['status'] = 'pending';

        return response()->json(Perizinan::create($data), 201);
    }

    /** Tampilkan QR untuk penjemputan (hanya jika sudah disetujui & masih berlaku) */
    public function qr(Request $request, Perizinan $perizinan)
    {
        abort_unless($perizinan->diajukan_oleh === $request->user()->id, 403);
        abort_unless($perizinan->qrMasihBerlaku(), 422, 'QR belum tersedia atau sudah kedaluwarsa.');

        return response()->json([
            'kode_qr' => $perizinan->kode_qr,
            'berlaku_sampai' => $perizinan->qr_berlaku_sampai,
        ]);
    }
}
