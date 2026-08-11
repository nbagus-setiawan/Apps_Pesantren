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

    /**
     * PERBAIKAN: cegah hapus tahun ajaran yang masih memiliki kelas terkait.
     * Migrasi kelas.tahun_ajaran_id pakai cascadeOnDelete(), sehingga tanpa
     * cek ini, seluruh kelas di tahun ajaran tsb akan ikut terhapus
     * permanen — dan lewat cascade lanjutan, mata_pelajaran serta
     * riwayat_kelas terkait juga ikut terhapus tanpa peringatan ke Admin.
     * Pola ini sama seperti guard yang sudah ada di KelasController,
     * AsramaController, dan KamarController.
     */
    public function destroy(TahunAjaran $tahunAjaran)
    {
        if ($tahunAjaran->is_active) {
            return response()->json(['message' => 'Tidak bisa menghapus tahun ajaran yang sedang aktif.'], 422);
        }

        if ($tahunAjaran->kelas()->exists()) {
            return response()->json([
                'message' => 'Tidak bisa dihapus, tahun ajaran ini masih memiliki kelas terkait.',
            ], 422);
        }

        $tahunAjaran->delete();

        return response()->json(['message' => 'Tahun ajaran dihapus.']);
    }
}