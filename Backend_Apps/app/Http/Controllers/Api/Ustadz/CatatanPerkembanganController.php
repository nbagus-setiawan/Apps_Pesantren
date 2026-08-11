<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\CatatanPerkembangan;
use App\Models\Kelas;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CatatanPerkembanganController extends Controller
{
    private function kelasDiampuIds(Request $request): array
    {
        $userId = $request->user()->id;

        return Kelas::where('wali_kelas_id', $userId)
            ->orWhereHas('mataPelajaran', fn ($q) => $q->where('ustadz_id', $userId))
            ->pluck('id')
            ->toArray();
    }

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
            'semester' => ['required', 'integer', 'min:1', 'max:2'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'isi' => ['required', 'string'],
            'tanggal' => ['required', 'date'],
        ]);

        $this->pastikanSantriDiKelasSaya($request, $data['santri_id']);

        $data['ustadz_id'] = $request->user()->id;

        return response()->json(CatatanPerkembangan::create($data), 201);
    }

    public function index(Request $request)
    {
        $request->validate([
            'santri_id' => ['required', 'exists:santri,id'],
        ]);

        $this->pastikanSantriDiKelasSaya($request, (int) $request->santri_id);

        return response()->json(
            CatatanPerkembangan::where('santri_id', $request->santri_id)
                ->latest('tanggal')
                ->get()
        );
    }
}