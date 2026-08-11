<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use Illuminate\Http\Request;

class WaliSantriController extends Controller
{
    /** Hubungkan akun wali (user role=wali_santri) ke seorang santri */
    public function store(Request $request, Santri $santri)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'hubungan' => ['required', 'in:ayah,ibu,wali'],
        ]);

        $santri->wali()->syncWithoutDetaching([
            $data['user_id'] => ['hubungan' => $data['hubungan']],
        ]);

        return response()->json($santri->load('wali'), 201);
    }

    public function destroy(Santri $santri, int $userId)
    {
        $santri->wali()->detach($userId);

        return response()->json(['message' => 'Wali dilepas dari santri.']);
    }
}
