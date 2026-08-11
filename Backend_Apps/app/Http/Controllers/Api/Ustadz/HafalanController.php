<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Hafalan;
use Illuminate\Http\Request;

class HafalanController extends Controller
{
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

        $data['dicatat_oleh'] = $request->user()->id;

        return response()->json(Hafalan::create($data), 201);
    }

    public function index(Request $request)
    {
        return response()->json(
            Hafalan::with('santri')
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->latest('tanggal')
                ->paginate($request->integer('per_page', 30))
        );
    }
}
