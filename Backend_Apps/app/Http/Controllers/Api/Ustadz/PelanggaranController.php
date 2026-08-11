<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\JenisPelanggaran;
use App\Models\Pelanggaran;
use Illuminate\Http\Request;

class PelanggaranController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'santri_id' => ['required', 'exists:santri,id'],
            'jenis_pelanggaran_id' => ['required', 'exists:jenis_pelanggaran,id'],
            'tanggal' => ['required', 'date'],
            'catatan' => ['nullable', 'string'],
        ]);

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
        return response()->json(
            Pelanggaran::with(['santri', 'jenisPelanggaran'])
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->latest('tanggal')
                ->paginate($request->integer('per_page', 30))
        );
    }
}
