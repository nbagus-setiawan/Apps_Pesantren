<?php

namespace App\Http\Controllers\Api\WaliSantri;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AnakController extends Controller
{
    /** Daftar santri (anak) milik wali yang sedang login */
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->anak()->with(['kelas', 'kamar'])->get()
        );
    }

    /** Detail lengkap 1 anak: nilai, absensi, hafalan, pelanggaran, catatan */
    public function show(Request $request, int $santriId)
    {
        $santri = $request->user()->anak()
            ->with(['kelas', 'kamar', 'nilai.mapel', 'absensi', 'hafalan', 'pelanggaran.jenisPelanggaran', 'catatanPerkembangan'])
            ->findOrFail($santriId);

        return response()->json($santri);
    }
}
