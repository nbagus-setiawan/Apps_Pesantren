<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSantriRequest;
use App\Http\Resources\SantriResource;
use App\Models\Santri;
use Illuminate\Http\Request;

class SantriController extends Controller
{
    public function index(Request $request)
    {
        $santri = Santri::with(['kelas', 'kamar'])
            ->when($request->kelas_id, fn ($q) => $q->where('kelas_id', $request->kelas_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, fn ($q) => $q->where('nama', 'like', "%{$request->search}%")
                ->orWhere('nis', 'like', "%{$request->search}%"))
            ->paginate($request->integer('per_page', 20));

        return SantriResource::collection($santri);
    }

    public function store(StoreSantriRequest $request)
    {
        $santri = Santri::create($request->validated());

        return new SantriResource($santri);
    }

    public function show(Santri $santri)
    {
        return new SantriResource($santri->load([
            'kelas', 'kamar', 'wali', 'riwayatKelas', 'riwayatKamar',
        ]));
    }

    public function update(Request $request, Santri $santri)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:255'],
            'alamat' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:aktif,alumni,keluar,cuti'],
        ]);

        $santri->update($data);

        return response()->json($santri);
    }

    /** Pindah kelas — otomatis menutup riwayat_kelas lama & membuka yang baru */
    public function pindahKelas(Request $request, Santri $santri)
    {
        $data = $request->validate([
            'kelas_id' => ['required', 'exists:kelas,id'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $santri->riwayatKelas()->whereNull('tanggal_selesai')->update(['tanggal_selesai' => now()]);

        $santri->riwayatKelas()->create([
            ...$data,
            'tanggal_mulai' => now(),
            'dipindahkan_oleh' => $request->user()->id,
        ]);

        $santri->update(['kelas_id' => $data['kelas_id']]);

        return response()->json($santri->fresh('kelas'));
    }

    public function destroy(Santri $santri)
    {
        $santri->update(['status' => 'keluar']);

        return response()->json(['message' => 'Status santri diubah menjadi keluar.']);
    }
}
