<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\PengajuanPindahKelas;
use Illuminate\Http\Request;

class PengajuanPindahKelasController extends Controller
{
    /** Ustadz mengajukan usulan pindah kelas untuk santri */
    public function store(Request $request)
    {
        $data = $request->validate([
            'santri_id' => ['required', 'exists:santri,id'],
            'kelas_tujuan_id' => ['required', 'exists:kelas,id'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $data['diajukan_oleh'] = $request->user()->id;
        $data['status'] = 'pending';

        return response()->json(PengajuanPindahKelas::create($data), 201);
    }

    /** Riwayat pengajuan milik ustadz yang login */
    public function index(Request $request)
    {
        return response()->json(
            PengajuanPindahKelas::with(['santri', 'kelasTujuan'])
                ->where('diajukan_oleh', $request->user()->id)
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }
}