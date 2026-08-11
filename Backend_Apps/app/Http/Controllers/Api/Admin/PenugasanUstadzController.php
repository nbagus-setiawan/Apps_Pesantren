<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PenugasanUstadz;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PenugasanUstadzController extends Controller
{
    /** Admin menunjuk ustadz sebagai Penanggung Jawab Perizinan atau Petugas Keuangan */
    public function store(Request $request)
    {
        $data = $request->validate([
            'ustadz_id' => [
                'required',
                Rule::exists('users', 'id')->where('role', 'ustadz'),
            ],
            'jenis_tugas' => ['required', 'in:perizinan,keuangan'],
        ]);

        // Cegah penunjukan ganda: kalau ustadz ini sudah aktif untuk jenis
        // tugas yang sama, tidak perlu baris baru.
        $sudahAktif = PenugasanUstadz::where('ustadz_id', $data['ustadz_id'])
            ->where('jenis_tugas', $data['jenis_tugas'])
            ->where('is_active', true)
            ->exists();

        if ($sudahAktif) {
            return response()->json([
                'message' => 'Ustadz ini sudah aktif ditugaskan untuk jenis tugas tersebut.',
            ], 422);
        }

        $penugasan = PenugasanUstadz::create([
            ...$data,
            'ditunjuk_oleh' => $request->user()->id,
            'is_active' => true,
        ]);

        return response()->json($penugasan, 201);
    }

    public function index(Request $request)
    {
        return response()->json(
            PenugasanUstadz::with('ustadz')
                ->when($request->jenis_tugas, fn ($q) => $q->where('jenis_tugas', $request->jenis_tugas))
                ->where('is_active', true)
                ->get()
        );
    }

    public function cabut(PenugasanUstadz $penugasan)
    {
        $penugasan->update(['is_active' => false]);

        return response()->json(['message' => 'Penugasan dicabut.']);
    }
}