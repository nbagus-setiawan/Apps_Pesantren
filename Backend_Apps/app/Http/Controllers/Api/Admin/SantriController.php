<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSantriRequest;
use App\Http\Resources\SantriResource;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SantriController extends Controller
{
    public function index(Request $request)
    {
        $santri = Santri::with(['kelas', 'kamar'])
            ->when($request->kelas_id, fn ($q) => $q->where('kelas_id', $request->kelas_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            // PERBAIKAN: bungkus nama/nis dalam satu grup where() agar
            // orWhere tidak lepas dari filter kelas_id/status di atas.
            // Tanpa grouping, SQL yang terbentuk adalah:
            //   WHERE kelas_id = ? AND status = ? AND nama LIKE ? OR nis LIKE ?
            // yang membuat filter kelas_id/status bocor saat search dipakai.
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($sub) use ($request) {
                    $sub->where('nama', 'like', "%{$request->search}%")
                        ->orWhere('nis', 'like', "%{$request->search}%");
                });
            })
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

    /**
     * Import data santri massal via CSV (PRD §4.1: "Import data santri
     * massal (Excel/CSV)"). Endpoint: POST /api/admin/santri/import
     *
     * Format kolom CSV (header wajib ada di baris pertama, urutan bebas):
     *   nis, nama, jenis_kelamin, tanggal_lahir, alamat, kelas_id, kamar_id, tanggal_masuk
     *
     * Setiap baris divalidasi independen. Baris yang gagal validasi TIDAK
     * menggagalkan keseluruhan import (baris lain tetap diproses) — supaya
     * Admin tidak harus mengulang upload 500 baris hanya karena 1 baris
     * NIS-nya duplikat. Ringkasan sukses/gagal dikembalikan di response,
     * termasuk nomor baris & pesan error per baris yang gagal.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');

        if ($handle === false) {
            return response()->json(['message' => 'File tidak dapat dibaca.'], 422);
        }

        $header = fgetcsv($handle);

        if (! $header) {
            fclose($handle);

            return response()->json(['message' => 'File CSV kosong atau tidak valid.'], 422);
        }

        // Normalisasi header: trim + lowercase, agar tidak sensitif spasi/kapital
        $header = array_map(fn ($h) => strtolower(trim((string) $h)), $header);

        $kolomWajib = ['nis', 'nama', 'jenis_kelamin', 'tanggal_lahir', 'tanggal_masuk'];
        $kolomHilang = array_diff($kolomWajib, $header);

        if (! empty($kolomHilang)) {
            fclose($handle);

            return response()->json([
                'message' => 'Header CSV tidak lengkap. Kolom wajib: ' . implode(', ', $kolomWajib),
                'kolom_hilang' => array_values($kolomHilang),
            ], 422);
        }

        $berhasil = 0;
        $gagal = [];
        $baris = 1; // baris 1 = header

        while (($row = fgetcsv($handle)) !== false) {
            $baris++;

            // Lewati baris kosong (mis. baris terakhir file CSV)
            if (count(array_filter($row, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }

            $data = array_combine($header, array_pad($row, count($header), null));

            $validator = Validator::make($data, [
                'nis' => ['required', 'string', 'unique:santri,nis'],
                'nama' => ['required', 'string', 'max:255'],
                'jenis_kelamin' => ['required', 'in:L,P'],
                'tanggal_lahir' => ['required', 'date'],
                'alamat' => ['nullable', 'string'],
                'kelas_id' => ['nullable', 'integer', 'exists:kelas,id'],
                'kamar_id' => ['nullable', 'integer', 'exists:kamar,id'],
                'tanggal_masuk' => ['required', 'date'],
            ]);

            if ($validator->fails()) {
                $gagal[] = [
                    'baris' => $baris,
                    'nis' => $data['nis'] ?? null,
                    'errors' => $validator->errors()->all(),
                ];

                continue;
            }

            $valid = $validator->validated();
            $valid['status'] = 'aktif';
            $valid['kelas_id'] = ($valid['kelas_id'] ?? '') !== '' ? $valid['kelas_id'] : null;
            $valid['kamar_id'] = ($valid['kamar_id'] ?? '') !== '' ? $valid['kamar_id'] : null;

            Santri::create($valid);
            $berhasil++;
        }

        fclose($handle);

        return response()->json([
            'message' => "Import selesai: {$berhasil} santri berhasil ditambahkan, " . count($gagal) . ' baris gagal.',
            'total_berhasil' => $berhasil,
            'total_gagal' => count($gagal),
            'detail_gagal' => $gagal,
        ], $berhasil > 0 ? 201 : 422);
    }

    /**
     * Pindah kelas — otomatis menutup riwayat_kelas lama & membuka yang baru.
     *
     * PERBAIKAN: dibungkus DB::transaction(), mengikuti pola yang sudah
     * diterapkan di KamarController::pindahkanSantri(). Sebelumnya tiga
     * operasi (tutup riwayat lama, buat riwayat baru, update
     * santri.kelas_id) berjalan sebagai tiga query terpisah tanpa
     * transaction. Kalau request terputus atau terjadi error di antara
     * ketiganya (mis. constraint violation, koneksi DB putus, atau
     * timeout), data bisa berakhir dalam state tidak konsisten —
     * misalnya riwayat_kelas lama sudah ditutup (tanggal_selesai terisi)
     * tapi riwayat baru gagal dibuat, sehingga santri tidak punya baris
     * riwayat_kelas aktif sama sekali padahal santri.kelas_id
     * sudah/belum berubah. Sama seperti kasus riwayat_kamar, ini
     * mengacaukan histori akademik santri dan sulit di-retry dengan aman.
     */
    public function pindahKelas(Request $request, Santri $santri)
    {
        $data = $request->validate([
            'kelas_id' => ['required', 'exists:kelas,id'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'keterangan' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($santri, $data, $request) {
            $santri->riwayatKelas()->whereNull('tanggal_selesai')->update(['tanggal_selesai' => now()]);

            $santri->riwayatKelas()->create([
                ...$data,
                'tanggal_mulai' => now(),
                'dipindahkan_oleh' => $request->user()->id,
            ]);

            $santri->update(['kelas_id' => $data['kelas_id']]);
        });

        return response()->json($santri->fresh('kelas'));
    }

    public function destroy(Santri $santri)
    {
        $santri->update(['status' => 'keluar']);

        return response()->json(['message' => 'Status santri diubah menjadi keluar.']);
    }
}