<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WaliSantriController extends Controller
{
    /** Hubungkan akun wali (user role=wali_santri) ke seorang santri */
    public function store(Request $request, Santri $santri)
    {
        $data = $request->validate([
            // PERBAIKAN: sebelumnya rule hanya 'exists:users,id', tanpa
            // memastikan user tersebut memang berrole 'wali_santri'.
            // Akibatnya Admin/Ustadz bisa "terpasang" sebagai wali dari
            // seorang santri, yang merusak asumsi seluruh sistem (mis.
            // AnakController, RaporController, TagihanController wali
            // semuanya berasumsi setiap baris wali_santri.user_id adalah
            // akun role wali_santri).
            'user_id' => [
                'required',
                Rule::exists('users', 'id')->where('role', 'wali_santri'),
            ],
            'hubungan' => ['required', 'in:ayah,ibu,wali'],
        ]);

        $user = User::find($data['user_id']);

        abort_unless(
            $user->is_active,
            422,
            'Tidak bisa menghubungkan wali yang akunnya nonaktif.'
        );

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