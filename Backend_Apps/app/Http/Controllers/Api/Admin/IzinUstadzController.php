<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\IzinUstadz;
use Illuminate\Http\Request;

class IzinUstadzController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            IzinUstadz::with('ustadz')
                ->when($request->status, fn ($q) => $q->where('status', $request->status))
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }

    public function proses(Request $request, IzinUstadz $izinUstadz)
    {
        $data = $request->validate(['status' => ['required', 'in:disetujui,ditolak']]);

        $izinUstadz->update([
            'status' => $data['status'],
            'disetujui_oleh' => $request->user()->id,
        ]);

        return response()->json($izinUstadz);
    }
}
