<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Concerns\ScopedToKelasDiampu;
use App\Http\Controllers\Controller;
use App\Models\JenisPelanggaran;
use App\Models\Pelanggaran;
use Illuminate\Http\Request;

class PelanggaranController extends Controller
{
    use ScopedToKelasDiampu;

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