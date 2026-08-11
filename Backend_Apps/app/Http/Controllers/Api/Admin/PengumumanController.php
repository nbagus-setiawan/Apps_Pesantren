<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pengumuman;
use Illuminate\Http\Request;

class PengumumanController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Pengumuman::latest()->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'isi' => ['required', 'string'],
            'target_role' => ['required', 'in:semua,admin,ustadz,wali_santri'],
            'target_kelas_id' => ['nullable', 'exists:kelas,id'],
        ]);

        $data['dibuat_oleh'] = $request->user()->id;

        return response()->json(Pengumuman::create($data), 201);
    }

    public function destroy(Pengumuman $pengumuman)
    {
        $pengumuman->delete();

        return response()->json(['message' => 'Pengumuman dihapus.']);
    }
}
