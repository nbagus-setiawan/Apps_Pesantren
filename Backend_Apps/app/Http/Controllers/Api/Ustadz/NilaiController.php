<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Nilai;
use Illuminate\Http\Request;

class NilaiController extends Controller
{
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

        $data['created_by'] = $request->user()->id;

        return response()->json(Nilai::create($data), 201);
    }

    public function index(Request $request)
    {
        return response()->json(
            Nilai::with(['santri', 'mapel'])
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->when($request->mapel_id, fn ($q) => $q->where('mapel_id', $request->mapel_id))
                ->paginate($request->integer('per_page', 30))
        );
    }

    public function update(Request $request, Nilai $nilai)
    {
        $nilai->update($request->validate([
            'nilai_angka' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string'],
        ]));

        return response()->json($nilai);
    }
}
