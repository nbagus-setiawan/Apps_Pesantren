<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MataPelajaran;
use Illuminate\Http\Request;

class MataPelajaranController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            MataPelajaran::with(['kelas', 'ustadz'])
                ->when($request->kelas_id, fn ($q) => $q->where('kelas_id', $request->kelas_id))
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'kelas_id' => ['required', 'exists:kelas,id'],
            'ustadz_id' => ['required', 'exists:users,id'],
        ]);

        return response()->json(MataPelajaran::create($data), 201);
    }

    public function update(Request $request, MataPelajaran $mataPelajaran)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:255'],
            'ustadz_id' => ['sometimes', 'exists:users,id'],
        ]);

        $mataPelajaran->update($data);

        return response()->json($mataPelajaran);
    }

    public function destroy(MataPelajaran $mataPelajaran)
    {
        $mataPelajaran->delete();

        return response()->json(['message' => 'Mata pelajaran dihapus.']);
    }
}
