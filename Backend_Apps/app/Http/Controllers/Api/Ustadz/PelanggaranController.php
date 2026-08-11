<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\JenisPelanggaran;
use App\Models\Kelas;
use App\Models\Pelanggaran;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PelanggaranController extends Controller
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
            'jenis_pelanggaran_id' => ['required', 'exists:jenis_pelanggaran,id'],
            'tanggal' => ['required', 'date'],
            'catatan' => ['nullable', 'string'],
        ]);

        $this->pastikanSantriDiKelasSaya($request, $data['santri_id']);

        $jenis = JenisPelanggaran::findOrFail($data['jenis_pelanggaran_id']);

        $pelanggaran = Pelanggaran::create([
            ...$data,
            'poin_saat_itu' => $jenis->poin, // snapshot poin agar histori tak berubah jika bobot diedit
            'dicatat_oleh' => $request->user()->id,
        ]);

        return response()->json($pelanggaran, 201);
    }

    public function index(Request $request)
    {
        $kelasIds = $this->kelasDiampuIds($request);

        return response()->json(
            Pelanggaran::with(['santri', 'jenisPelanggaran'])
                ->whereHas('santri', fn ($q) => $q->whereIn('kelas_id', $kelasIds))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->latest('tanggal')
                ->paginate($request->integer('per_page', 30))
        );
    }
}