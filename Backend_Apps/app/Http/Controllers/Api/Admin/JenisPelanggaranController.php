<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\JenisPelanggaran;
use Illuminate\Http\Request;

class JenisPelanggaranController extends Controller
{
    public function index()
    {
        return response()->json(JenisPelanggaran::orderBy('kategori')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'poin' => ['required', 'integer', 'min:1'],
            'kategori' => ['required', 'in:ringan,sedang,berat'],
        ]);

        return response()->json(JenisPelanggaran::create($data), 201);
    }

    public function update(Request $request, JenisPelanggaran $jenisPelanggaran)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:255'],
            'poin' => ['sometimes', 'integer', 'min:1'],
            'kategori' => ['sometimes', 'in:ringan,sedang,berat'],
        ]);

        // catatan: mengubah poin di sini TIDAK mengubah histori pelanggaran lama
        // karena 'pelanggaran.poin_saat_itu' sudah snapshot terpisah.
        $jenisPelanggaran->update($data);

        return response()->json($jenisPelanggaran);
    }

    public function destroy(JenisPelanggaran $jenisPelanggaran)
    {
        if ($jenisPelanggaran->pelanggaran()->exists()) {
            return response()->json(['message' => 'Tidak bisa dihapus, sudah dipakai di histori pelanggaran.'], 422);
        }

        $jenisPelanggaran->delete();

        return response()->json(['message' => 'Jenis pelanggaran dihapus.']);
    }
}
