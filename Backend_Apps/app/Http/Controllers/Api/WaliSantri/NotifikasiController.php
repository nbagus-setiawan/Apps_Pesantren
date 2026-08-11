<?php

namespace App\Http\Controllers\Api\WaliSantri;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotifikasiController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->notifikasi()->latest()->paginate(30)
        );
    }

    public function tandaiDibaca(Request $request, int $id)
    {
        $request->user()->notifikasi()->where('id', $id)->update(['is_read' => true]);

        return response()->json(['message' => 'Ditandai sudah dibaca.']);
    }
}
