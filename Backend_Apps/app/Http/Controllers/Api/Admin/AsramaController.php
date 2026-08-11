<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asrama;
use Illuminate\Http\Request;

class AsramaController extends Controller
{
    public function index()
    {
        return response()->json(Asrama::with('pembina')->withCount('kamar')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string'],
            'pembina_id' => ['nullable', 'exists:users,id'],
        ]);

        return response()->json(Asrama::create($data), 201);
    }

    public function show(Asrama $asrama)
    {
        return response()->json($asrama->load(['pembina', 'kamar.santri']));
    }

    public function update(Request $request, Asrama $asrama)
    {
        $asrama->update($request->validate([
            'nama' => ['sometimes', 'string'],
            'pembina_id' => ['nullable', 'exists:users,id'],
        ]));

        return response()->json($asrama);
    }

    public function destroy(Asrama $asrama)
    {
        $asrama->delete();

        return response()->json(['message' => 'Asrama dihapus.']);
    }
}
