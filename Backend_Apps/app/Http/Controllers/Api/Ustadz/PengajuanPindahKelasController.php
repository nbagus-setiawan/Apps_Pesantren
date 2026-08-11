<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Concerns\ScopedToKelasDiampu;
use App\Http\Controllers\Controller;
use App\Models\PengajuanPindahKelas;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PengajuanPindahKelasController extends Controller
{
    use ScopedToKelasDiampu;

    /** Ustadz mengajukan usulan pindah kelas untuk santri */
    public function store(Request $request)
    {
        $data = $request->validate([
            'santri_id' => ['required', 'exists:santri,id'],
            'kelas_tujuan_id' => ['required', 'exists:kelas,id'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $this->pastikanSantriDiKelasSaya($request, $data['santri_id']);

        // Kelas tujuan harus beda dari kelas santri saat ini, kalau tidak
        // pengajuan tidak ada gunanya.
        $santri = Santri::findOrFail($data['santri_id']);

        if ($santri->kelas_id === (int) $data['kelas_tujuan_id']) {
            throw ValidationException::withMessages([
                'kelas_tujuan_id' => ['Kelas tujuan sama dengan kelas santri saat ini.'],
            ]);
        }

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