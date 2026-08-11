<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pengaturan;
use App\Models\Santri;
use Illuminate\Http\Request;

class PelanggaranRekapController extends Controller
{
    /** Rekap total poin pelanggaran seluruh santri, dengan flag "melebihi_ambang_batas" */
    public function index(Request $request)
    {
        $ambangBatas = (int) Pengaturan::get('ambang_batas_poin_pelanggaran', 100);

        $santri = Santri::withSum('pelanggaran as total_poin', 'poin_saat_itu')
            ->when($request->kelas_id, fn ($q) => $q->where('kelas_id', $request->kelas_id))
            ->where('status', 'aktif')
            ->orderByDesc('total_poin')
            ->paginate($request->integer('per_page', 30));

        $santri->getCollection()->transform(function ($s) use ($ambangBatas) {
            $s->total_poin = (int) ($s->total_poin ?? 0);
            $s->melebihi_ambang_batas = $s->total_poin > $ambangBatas;

            return $s;
        });

        return response()->json([
            'ambang_batas' => $ambangBatas,
            'data' => $santri,
        ]);
    }
}