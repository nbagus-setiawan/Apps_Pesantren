<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Concerns\ScopedToKelasDiampu;
use App\Http\Controllers\Controller;
use App\Models\Nilai;
use Illuminate\Http\Request;

class NilaiController extends Controller
{
    use ScopedToKelasDiampu;

    public function store(Request $request)
    {
        $data = $request->validate([
            'santri_id' => ['required', 'exists:santri,id'],
            'mapel_id' => ['required', 'exists:mata_pelajaran,id'],
            'semester' => ['required', 'integer', 'min:1', 'max:2'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'nilai_angka' => ['required', 'numeric', 'min:0', 'max:100'],
            'nilai_huruf' => ['nullable', 'string', 'max:2'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $this->pastikanSantriDiKelasSaya($request, $data['santri_id']);

        $data['created_by'] = $request->user()->id;

        return response()->json(Nilai::create($data), 201);
    }

    public function index(Request $request)
    {
        $kelasIds = $this->kelasDiampuIds($request);

        return response()->json(
            Nilai::with(['santri', 'mapel'])
                ->whereHas('santri', fn ($q) => $q->whereIn('kelas_id', $kelasIds))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->when($request->mapel_id, fn ($q) => $q->where('mapel_id', $request->mapel_id))
                ->paginate($request->integer('per_page', 30))
        );
    }

    public function update(Request $request, Nilai $nilai)
    {
        $this->pastikanSantriDiKelasSaya($request, $nilai->santri_id);

        $nilai->update($request->validate([
            'nilai_angka' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string'],
        ]));

        return response()->json($nilai);
    }
}