<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use Illuminate\Http\Request;

/**
 * PRD v1.4 §4.2: "Lihat daftar santri di kelas yang diampu."
 *
 * "Kelas yang diampu" mencakup: kelas di mana Ustadz ini menjadi wali kelas
 * ATAU kelas di mana Ustadz ini mengajar salah satu mata pelajaran.
 */
class KelasController extends Controller
{
    private function kelasDiampuQuery(Request $request)
    {
        $userId = $request->user()->id;

        return Kelas::where('wali_kelas_id', $userId)
            ->orWhereHas('mataPelajaran', fn ($q) => $q->where('ustadz_id', $userId));
    }

    public function index(Request $request)
    {
        $kelas = $this->kelasDiampuQuery($request)
            ->with('tahunAjaran')
            ->withCount('santri')
            ->get();

        return response()->json($kelas);
    }

    /** Daftar santri pada satu kelas yang diampu Ustadz ini */
    public function santri(Request $request, int $kelasId)
    {
        $kelas = $this->kelasDiampuQuery($request)->findOrFail($kelasId);

        return response()->json(
            $kelas->santri()
                ->when($request->status, fn ($q) => $q->where('status', $request->status))
                ->orderBy('nama')
                ->get()
        );
    }
}
