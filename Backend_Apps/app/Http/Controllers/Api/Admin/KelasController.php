<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use Illuminate\Http\Request;

class KelasController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Kelas::with(['waliKelas', 'tahunAjaran'])->withCount('santri')
                ->when($request->tahun_ajaran_id, fn ($q) => $q->where('tahun_ajaran_id', $request->tahun_ajaran_id))
                ->paginate($request->integer('per_page', 20))
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string'],
            'tingkat' => ['required', 'string'],
            'wali_kelas_id' => ['nullable', 'exists:users,id'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
        ]);

        return response()->json(Kelas::create($data), 201);
    }

    public function show(Kelas $kela)
    {
        return response()->json($kela->load(['waliKelas', 'santri', 'mataPelajaran']));
    }

    public function update(Request $request, Kelas $kela)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string'],
            'wali_kelas_id' => ['nullable', 'exists:users,id'],
        ]);

        $kela->update($data);

        return response()->json($kela);
    }

    /**
     * PERBAIKAN: cegah hapus kelas yang masih memiliki santri aktif.
     * mata_pelajaran & riwayat_kelas pakai cascadeOnDelete, dan
     * santri.kelas_id pakai nullOnDelete — tanpa cek ini, seluruh mata
     * pelajaran dan riwayat_kelas terkait akan ikut terhapus permanen,
     * dan kelas santri jadi kosong tanpa peringatan — bertentangan
     * dengan kebutuhan audit trail di PRD §7.
     */
    public function destroy(Kelas $kela)
    {
        if ($kela->santri()->exists()) {
            return response()->json([
                'message' => 'Tidak bisa dihapus, kelas masih memiliki santri aktif.',
            ], 422);
        }

        $kela->delete();

        return response()->json(['message' => 'Kelas dihapus.']);
    }
}