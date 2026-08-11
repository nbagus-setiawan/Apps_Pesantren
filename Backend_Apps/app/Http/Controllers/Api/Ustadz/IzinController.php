<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Models\IzinUstadz;
use Illuminate\Http\Request;

class IzinController extends Controller
{
    /** Ustadz mengajukan izin/cuti untuk dirinya sendiri */
    public function store(Request $request)
    {
        $data = $request->validate([
            'jenis' => ['required', 'in:cuti,sakit,izin_lain'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'alasan' => ['required', 'string'],
        ]);

        $data['ustadz_id'] = $request->user()->id;
        $data['status'] = 'pending';

        return response()->json(IzinUstadz::create($data), 201);
    }

    public function index(Request $request)
    {
        return response()->json(
            IzinUstadz::where('ustadz_id', $request->user()->id)->latest()->get()
        );
    }
}
