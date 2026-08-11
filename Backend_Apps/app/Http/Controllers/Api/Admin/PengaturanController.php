<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pengaturan;
use Illuminate\Http\Request;

class PengaturanController extends Controller
{
    public function index()
    {
        return response()->json(
            Pengaturan::all()->pluck('value', 'key')
        );
    }

    /** Update banyak key sekaligus: { "ambang_batas_poin_pelanggaran": "120", "qr_durasi_jam": "48" } */
    public function update(Request $request)
    {
        $data = $request->validate([
            '*' => ['nullable', 'string'],
        ]);

        foreach ($request->all() as $key => $value) {
            Pengaturan::set($key, $value);
        }

        return response()->json(Pengaturan::all()->pluck('value', 'key'));
    }
}