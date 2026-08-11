<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tagihan;
use Illuminate\Http\Request;

class TagihanController extends Controller
{
    /** Generate tagihan massal untuk seluruh santri aktif (mis. SPP bulan berjalan) */
    public function generateMassal(Request $request)
    {
        $data = $request->validate([
            'jenis_tagihan_id' => ['required', 'exists:jenis_tagihan,id'],
            'periode' => ['required', 'string'],
            'nominal' => ['required', 'numeric', 'min:0'],
            'jatuh_tempo' => ['required', 'date'],
        ]);

        $santriAktif = \App\Models\Santri::where('status', 'aktif')->pluck('id');

        $rows = $santriAktif->map(fn ($id) => [
            'santri_id' => $id,
            'jenis_tagihan_id' => $data['jenis_tagihan_id'],
            'periode' => $data['periode'],
            'nominal' => $data['nominal'],
            'jatuh_tempo' => $data['jatuh_tempo'],
            'status' => 'belum_bayar',
            'dibuat_oleh' => $request->user()->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Tagihan::insert($rows->toArray());

        return response()->json(['message' => "Tagihan dibuat untuk {$rows->count()} santri."]);
    }

    public function index(Request $request)
    {
        return response()->json(
            Tagihan::with(['santri', 'jenisTagihan'])
                ->when($request->status, fn ($q) => $q->where('status', $request->status))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->paginate($request->integer('per_page', 20))
        );
    }
}
