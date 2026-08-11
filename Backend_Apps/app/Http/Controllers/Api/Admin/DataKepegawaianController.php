<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DataKepegawaian;
use App\Models\User;
use Illuminate\Http\Request;

class DataKepegawaianController extends Controller
{
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'nip_nuptk' => ['nullable', 'string'],
            'alamat' => ['nullable', 'string'],
            'pendidikan_terakhir' => ['nullable', 'string'],
            'tanggal_mulai_tugas' => ['required', 'date'],
            'status_kepegawaian' => ['required', 'in:tetap,honorer,magang'],
        ]);

        $kepegawaian = DataKepegawaian::updateOrCreate(['user_id' => $user->id], $data);

        return response()->json($kepegawaian);
    }

    public function show(User $user)
    {
        return response()->json($user->dataKepegawaian);
    }
}
