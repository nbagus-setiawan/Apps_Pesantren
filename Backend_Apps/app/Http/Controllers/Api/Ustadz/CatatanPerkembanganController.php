<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\CatatanPerkembangan;
use Illuminate\Http\Request;

class CatatanPerkembanganController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'santri_id' => ['required', 'exists:santri,id'],
            'semester' => ['required', 'integer', 'min:1', 'max:2'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'isi' => ['required', 'string'],
            'tanggal' => ['required', 'date'],
        ]);

        $data['ustadz_id'] = $request->user()->id;

        return response()->json(CatatanPerkembangan::create($data), 201);
    }

    public function index(Request $request)
    {
        return response()->json(
            CatatanPerkembangan::where('santri_id', $request->santri_id)
                ->latest('tanggal')
                ->get()
        );
    }
}
