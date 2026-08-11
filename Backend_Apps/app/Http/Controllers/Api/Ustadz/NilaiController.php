<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\Nilai;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class NilaiController extends Controller
{
    /**
     * Daftar ID kelas yang diampu ustadz yang login (wali kelas ATAU
     * pengajar salah satu mata pelajaran di kelas itu).
     */
    private function kelasDiampuIds(Request $request): array
    {
        $userId = $request->user()->id;

        return Kelas::where('wali_kelas_id', $userId)
            ->orWhereHas('mataPelajaran', fn ($q) => $q->where('ustadz_id', $userId))
            ->pluck('id')
            ->toArray();
    }

    /**
     * Pastikan santri dengan ID ini benar-benar berada di salah satu kelas
     * yang diampu ustadz yang login. Mencegah ustadz menginput data untuk
     * santri di luar kelasnya (lihat PRD §7: privasi data dicek di setiap
     * endpoint, bukan diasumsikan dari tampilan).
     */
    private function pastikanSantriDiKelasSaya(Request $request, int $santriId): void
    {
        $kelasIds = $this->kelasDiampuIds($request);

        $valid = Santri::where('id', $santriId)
            ->whereIn('kelas_id', $kelasIds)
            ->exists();

        if (! $valid) {
            throw ValidationException::withMessages([
                'santri_id' => ['Santri ini tidak berada di kelas yang Anda ampu.'],
            ]);
        }
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'santri_id' => ['required', 'exists:santri,id'],
            'mapel_id' => ['required', 'exists:mata_pelajaran,id'],
            'semester' => ['required', 'integer', 'min:1', 'max:2'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'nilai_angka' => ['required', 'numeric', 'min:0', 'max:100'],
            'nilai_huruf' => ['nullable', 'string', 'max:2'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $this->pastikanSantriDiKelasSaya($request, $data['santri_id']);

        $data['created_by'] = $request->user()->id;

        return response()->json(Nilai::create($data), 201);
    }

    public function index(Request $request)
    {
        $kelasIds = $this->kelasDiampuIds($request);

        return response()->json(
            Nilai::with(['santri', 'mapel'])
                ->whereHas('santri', fn ($q) => $q->whereIn('kelas_id', $kelasIds))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->when($request->mapel_id, fn ($q) => $q->where('mapel_id', $request->mapel_id))
                ->paginate($request->integer('per_page', 30))
        );
    }

    public function update(Request $request, Nilai $nilai)
    {
        // Pastikan nilai yang mau diedit memang milik santri di kelas yang diampu
        $this->pastikanSantriDiKelasSaya($request, $nilai->santri_id);

        $nilai->update($request->validate([
            'nilai_angka' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string'],
        ]));

        return response()->json($nilai);
    }
}