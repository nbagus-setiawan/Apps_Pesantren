<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\JenisTagihan;
use Illuminate\Http\Request;

class JenisTagihanController extends Controller
{
    public function index()
    {
        return response()->json(JenisTagihan::orderBy('nama')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'nominal_default' => ['required', 'numeric', 'min:0'],
            'tipe' => ['required', 'in:bulanan,sekali,tahunan'],
        ]);

        return response()->json(JenisTagihan::create($data), 201);
    }

    public function update(Request $request, JenisTagihan $jenisTagihan)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:255'],
            'nominal_default' => ['sometimes', 'numeric', 'min:0'],
            'tipe' => ['sometimes', 'in:bulanan,sekali,tahunan'],
        ]);

        $jenisTagihan->update($data);

        return response()->json($jenisTagihan);
    }

    public function destroy(JenisTagihan $jenisTagihan)
    {
        if ($jenisTagihan->tagihan()->exists()) {
            return response()->json(['message' => 'Tidak bisa dihapus, sudah dipakai di histori tagihan.'], 422);
        }

        $jenisTagihan->delete();

        return response()->json(['message' => 'Jenis tagihan dihapus.']);
    }
}
