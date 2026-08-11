<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Concerns\ScopedToKelasDiampu;
use App\Http\Controllers\Controller;
use App\Models\Hafalan;
use Illuminate\Http\Request;

class HafalanController extends Controller
{
    use ScopedToKelasDiampu;

    public function store(Request $request)
    {
        $data = $request->validate([
            'santri_id' => ['required', 'exists:santri,id'],
            'surah' => ['required', 'string'],
            'ayat_mulai' => ['required', 'integer', 'min:1'],
            'ayat_selesai' => ['required', 'integer', 'gte:ayat_mulai'],
            'tanggal' => ['required', 'date'],
            'status' => ['required', 'in:lancar,mengulang,belum'],
            'catatan' => ['nullable', 'string'],
        ]);

        $this->pastikanSantriDiKelasSaya($request, $data['santri_id']);

        $data['dicatat_oleh'] = $request->user()->id;

        return response()->json(Hafalan::create($data), 201);
    }

    public function index(Request $request)
    {
        $kelasIds = $this->kelasDiampuIds($request);

        return response()->json(
            Hafalan::with('santri')
                ->whereHas('santri', fn ($q) => $q->whereIn('kelas_id', $kelasIds))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->latest('tanggal')
                ->paginate($request->integer('per_page', 30))
        );
    }
}