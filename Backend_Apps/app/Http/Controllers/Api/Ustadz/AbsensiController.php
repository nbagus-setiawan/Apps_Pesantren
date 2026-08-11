<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Kelas;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AbsensiController extends Controller
{
    private function kelasDiampuIds(Request $request): array
    {
        $userId = $request->user()->id;

        return Kelas::where('wali_kelas_id', $userId)
            ->orWhereHas('mataPelajaran', fn ($q) => $q->where('ustadz_id', $userId))
            ->pluck('id')
            ->toArray();
    }

    /** Input absensi harian per kelas (bulk) */
    public function storeBulk(Request $request)
    {
        $data = $request->validate([
            'tanggal' => ['required', 'date'],
            'data' => ['required', 'array'],
            'data.*.santri_id' => ['required', 'exists:santri,id'],
            'data.*.status' => ['required', 'in:hadir,sakit,izin,alpa'],
            'data.*.keterangan' => ['nullable', 'string'],
        ]);

        $kelasIds = $this->kelasDiampuIds($request);
        $santriIds = collect($data['data'])->pluck('santri_id')->unique();

        $santriValidCount = \App\Models\Santri::whereIn('id', $santriIds)
            ->whereIn('kelas_id', $kelasIds)
            ->count();

        if ($santriValidCount !== $santriIds->count()) {
            throw ValidationException::withMessages([
                'data' => ['Terdapat santri yang tidak berada di kelas yang Anda ampu.'],
            ]);
        }

        foreach ($data['data'] as $row) {
            Absensi::updateOrCreate(
                ['santri_id' => $row['santri_id'], 'tanggal' => $data['tanggal']],
                [
                    'status' => $row['status'],
                    'keterangan' => $row['keterangan'] ?? null,
                    'dicatat_oleh' => $request->user()->id,
                ]
            );
        }

        return response()->json(['message' => 'Absensi tersimpan.']);
    }

    public function index(Request $request)
    {
        $kelasIds = $this->kelasDiampuIds($request);

        return response()->json(
            Absensi::with('santri')
                ->whereHas('santri', fn ($q) => $q->whereIn('kelas_id', $kelasIds))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->when($request->tanggal, fn ($q) => $q->whereDate('tanggal', $request->tanggal))
                ->paginate($request->integer('per_page', 30))
        );
    }
}