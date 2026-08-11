<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kamar;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KamarController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Kamar::with('asrama')->withCount('santri')
                ->when($request->asrama_id, fn ($q) => $q->where('asrama_id', $request->asrama_id))
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'asrama_id' => ['required', 'exists:asrama,id'],
            'nama' => ['required', 'string'],
            'kapasitas' => ['required', 'integer', 'min:1'],
        ]);

        return response()->json(Kamar::create($data), 201);
    }

    /**
     * Pindah kamar santri — tutup riwayat lama, buka riwayat baru.
     *
     * PERBAIKAN: dibungkus DB::transaction(). Sebelumnya tiga operasi
     * (tutup riwayat lama, buat riwayat baru, update santri.kamar_id)
     * berjalan sebagai tiga query terpisah tanpa transaction. Kalau
     * request terputus atau terjadi error di antara ketiganya, data bisa
     * berakhir dalam state tidak konsisten — misalnya riwayat lama sudah
     * ditutup (tanggal_selesai terisi) tapi riwayat baru gagal dibuat,
     * sehingga santri tidak punya baris riwayat_kamar aktif sama sekali
     * padahal kolom santri.kamar_id sudah/belum berubah. Pola yang sama
     * berlaku untuk SantriController::pindahKelas() dan
     * PengajuanPindahKelasController::proses() yang idealnya juga
     * ditinjau dengan pola ini.
     */
    public function pindahkanSantri(Request $request, Kamar $kamar)
    {
        $data = $request->validate(['santri_id' => ['required', 'exists:santri,id']]);
        $santri = Santri::findOrFail($data['santri_id']);

        // Cegah pindah ke kamar yang sudah penuh. Santri yang sudah ada
        // di kamar ini sendiri (mis. update data lain) tidak dihitung.
        $okupansiSaatIni = $kamar->santri()->where('id', '!=', $santri->id)->count();

        if ($okupansiSaatIni >= $kamar->kapasitas) {
            throw ValidationException::withMessages([
                'kamar_id' => ["Kamar {$kamar->nama} sudah penuh (kapasitas {$kamar->kapasitas})."],
            ]);
        }

        DB::transaction(function () use ($santri, $kamar, $request) {
            $santri->riwayatKamar()->whereNull('tanggal_selesai')->update(['tanggal_selesai' => now()]);
            $santri->riwayatKamar()->create([
                'kamar_id' => $kamar->id,
                'tanggal_mulai' => now(),
                'dipindahkan_oleh' => $request->user()->id,
            ]);
            $santri->update(['kamar_id' => $kamar->id]);
        });

        return response()->json($santri->fresh('kamar'));
    }

    public function destroy(Kamar $kamar)
    {
        $kamar->delete();

        return response()->json(['message' => 'Kamar dihapus.']);
    }
}