<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PenugasanUstadz;
use Illuminate\Http\Request;

class PenugasanUstadzController extends Controller
{
    /** Admin menunjuk ustadz sebagai Penanggung Jawab Perizinan atau Petugas Keuangan */
    public function store(Request $request)
    {
        $data = $request->validate([
            'ustadz_id' => ['required', 'exists:users,id'],
            'jenis_tugas' => ['required', 'in:perizinan,keuangan'],
        ]);

        $penugasan = PenugasanUstadz::create([
            ...$data,
            'ditunjuk_oleh' => $request->user()->id,
            'is_active' => true,
        ]);

        return response()->json($penugasan, 201);
    }

    public function index(Request $request)
    {
        return response()->json(
            PenugasanUstadz::with('ustadz')
                ->when($request->jenis_tugas, fn ($q) => $q->where('jenis_tugas', $request->jenis_tugas))
                ->where('is_active', true)
                ->get()
        );
    }

    public function cabut(PenugasanUstadz $penugasan)
    {
        $penugasan->update(['is_active' => false]);

        return response()->json(['message' => 'Penugasan dicabut.']);
    }
}
