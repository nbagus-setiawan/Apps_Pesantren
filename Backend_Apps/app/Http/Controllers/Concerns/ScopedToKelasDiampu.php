<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Kelas;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Digunakan oleh controller Ustadz untuk membatasi akses hanya ke kelas
 * yang diampu (sebagai wali kelas ATAU pengajar salah satu mata pelajaran
 * di kelas itu). Diekstrak dari duplikasi logika yang sebelumnya tersebar
 * di banyak controller agar tidak drift kalau aturan ini berubah.
 */
trait ScopedToKelasDiampu
{
    protected function kelasDiampuIds(Request $request): array
    {
        $userId = $request->user()->id;

        return Kelas::where('wali_kelas_id', $userId)
            ->orWhereHas('mataPelajaran', fn ($q) => $q->where('ustadz_id', $userId))
            ->pluck('id')
            ->toArray();
    }

    protected function pastikanSantriDiKelasSaya(Request $request, int $santriId): void
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
}