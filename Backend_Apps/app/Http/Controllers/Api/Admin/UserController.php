<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

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
        // hashing otomatis lewat cast 'password' => 'hashed'. Meng-hash
        // manual di sini akan menyebabkan password ter-hash dua kali
        // sehingga login gagal untuk user yang dibuat lewat endpoint ini.
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
        ]);

        $user->update($data);

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        $user->update(['is_active' => false]);

        return response()->json(['message' => 'User dinonaktifkan.']);
    }
}