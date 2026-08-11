<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asrama;
use Illuminate\Http\Request;

class AsramaController extends Controller
{
    public function index()
    {
        return response()->json(Asrama::with('pembina')->withCount('kamar')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string'],
            'pembina_id' => ['nullable', 'exists:users,id'],
        ]);

        return response()->json(Asrama::create($data), 201);
    }

    public function show(Asrama $asrama)
    {
        return response()->json($asrama->load(['pembina', 'kamar.santri']));
    }

    public function update(Request $request, Asrama $asrama)
    {
        $asrama->update($request->validate([
            'nama' => ['sometimes', 'string'],
            'pembina_id' => ['nullable', 'exists:users,id'],
        ]));

        return response()->json($asrama);
    }

    /**
     * PERBAIKAN: cegah hapus asrama yang masih memiliki data kamar.
     * kamar.asrama_id pakai cascadeOnDelete, sehingga tanpa cek ini
     * seluruh kamar di asrama tersebut (dan riwayat huni santrinya)
     * akan ikut terhapus permanen tanpa peringatan ke Admin —
     * bertentangan dengan kebutuhan audit trail di PRD §7.
     */
    public function destroy(Asrama $asrama)
    {
        if ($asrama->kamar()->exists()) {
            return response()->json([
                'message' => 'Tidak bisa dihapus, asrama masih memiliki data kamar. Hapus kamar terlebih dahulu.',
            ], 422);
        }

        $asrama->delete();

        return response()->json(['message' => 'Asrama dihapus.']);
    }
}