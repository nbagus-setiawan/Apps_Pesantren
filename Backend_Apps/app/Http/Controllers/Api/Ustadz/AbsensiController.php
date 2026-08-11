<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use Illuminate\Http\Request;

class AbsensiController extends Controller
{
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
        return response()->json(
            Absensi::with('santri')
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->when($request->tanggal, fn ($q) => $q->whereDate('tanggal', $request->tanggal))
                ->paginate($request->integer('per_page', 30))
        );
    }
}
