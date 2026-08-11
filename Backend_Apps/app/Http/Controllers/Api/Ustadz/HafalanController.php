<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Hafalan;
use App\Models\Kelas;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class HafalanController extends Controller
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
            'surah' => ['required', 'string'],
            'ayat_mulai' => ['required', 'integer', 'min:1'],
            'ayat_selesai' => ['required', 'integer', 'gte:ayat_mulai'],
            'tanggal' => ['required', 'date'],
            'status' => ['required', 'in:lancar,mengulang,belum'],
            'catatan' => ['nullable', 'string'],
        ]);

        $this->pastikanSantriDiKelasSaya($request, $data['santri_id']);

        $data['dicatat_oleh'] = $request->user()->id;

        return response()->json(Hafalan::create($data), 201);
    }

    public function index(Request $request)
    {
        $kelasIds = $this->kelasDiampuIds($request);

        return response()->json(
            Hafalan::with('santri')
                ->whereHas('santri', fn ($q) => $q->whereIn('kelas_id', $kelasIds))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->latest('tanggal')
                ->paginate($request->integer('per_page', 30))
        );
    }
}