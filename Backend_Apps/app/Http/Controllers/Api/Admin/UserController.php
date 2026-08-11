<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::when($request->role, fn ($q) => $q->where('role', $request->role))
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->paginate($request->integer('per_page', 20));

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,ustadz,wali_santri'],
        ]);

        // Tidak perlu Hash::make() di sini — model User sudah melakukan
        // hashing otomatis lewat cast 'password' => 'hashed'.
        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('dataKepegawaian'));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'role' => ['sometimes', Rule::in(['admin', 'ustadz', 'wali_santri'])],
        ]);

        // Cegah admin terakhir tidak sengaja "menurunkan" dirinya sendiri
        // sehingga sistem kehilangan admin sama sekali.
        if (
            isset($data['role'])
            && $data['role'] !== 'admin'
            && $user->id === $request->user()->id
            && $user->role === 'admin'
            && User::where('role', 'admin')->where('id', '!=', $user->id)->count() === 0
        ) {
            return response()->json([
                'message' => 'Tidak bisa mengubah role admin terakhir di sistem.',
            ], 422);
        }

        $user->update($data);

        return response()->json($user);
    }

    /**
     * BARU: Reset password oleh Admin (PRD §4.1: "Reset password, nonaktifkan akun").
     * Endpoint terpisah dari update() agar tidak tercampur dengan update
     * profil biasa, dan supaya audit/permission-nya bisa dibedakan kalau
     * nanti masuk ke Fase 2 (role & permission granular).
     *
     * Endpoint: PUT /api/admin/users/{user}/reset-password
     */
    public function resetPassword(Request $request, User $user)
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Tidak perlu Hash::make() — cast 'password' => 'hashed' di model
        // User sudah menghash otomatis saat update().
        $user->update(['password' => $data['password']]);

        // Opsional tapi disarankan: cabut semua token lama supaya sesi/API
        // token yang lama tidak bisa dipakai lagi setelah password direset.
        $user->tokens()->delete();

        return response()->json(['message' => 'Password berhasil direset.']);
    }

    public function destroy(User $user)
    {
        $user->update(['is_active' => false]);

        return response()->json(['message' => 'User dinonaktifkan.']);
    }
}