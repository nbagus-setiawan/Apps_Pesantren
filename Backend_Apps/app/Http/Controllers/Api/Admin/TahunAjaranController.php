<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;

class TahunAjaranController extends Controller
{
    public function index()
    {
        return response()->json(TahunAjaran::orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'unique:tahun_ajaran,nama'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('is_active')) {
            TahunAjaran::query()->update(['is_active' => false]); // hanya 1 tahun ajaran aktif
        }

        return response()->json(TahunAjaran::create($data), 201);
    }

    public function update(Request $request, TahunAjaran $tahunAjaran)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'unique:tahun_ajaran,nama,' . $tahunAjaran->id],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('is_active')) {
            TahunAjaran::query()->where('id', '!=', $tahunAjaran->id)->update(['is_active' => false]);
        }

        $tahunAjaran->update($data);

        return response()->json($tahunAjaran);
    }

    public function destroy(TahunAjaran $tahunAjaran)
    {
        if ($tahunAjaran->is_active) {
            return response()->json(['message' => 'Tidak bisa menghapus tahun ajaran yang sedang aktif.'], 422);
        }

        $tahunAjaran->delete();

        return response()->json(['message' => 'Tahun ajaran dihapus.']);
    }
}
