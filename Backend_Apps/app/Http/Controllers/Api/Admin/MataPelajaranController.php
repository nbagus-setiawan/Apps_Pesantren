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

    /**
     * PERBAIKAN: cegah hapus mata pelajaran yang masih memiliki riwayat
     * nilai santri. Migrasi nilai.mapel_id pakai cascadeOnDelete(),
     * sehingga tanpa cek ini, seluruh riwayat nilai santri di mapel
     * tersebut akan ikut terhapus permanen tanpa peringatan ke Admin —
     * bertentangan dengan kebutuhan audit trail di PRD §7.
     */
    public function destroy(MataPelajaran $mataPelajaran)
    {
        if ($mataPelajaran->nilai()->exists()) {
            return response()->json([
                'message' => 'Tidak bisa dihapus, mata pelajaran ini masih memiliki riwayat nilai santri.',
            ], 422);
        }

        $mataPelajaran->delete();

        return response()->json(['message' => 'Mata pelajaran dihapus.']);
    }
}