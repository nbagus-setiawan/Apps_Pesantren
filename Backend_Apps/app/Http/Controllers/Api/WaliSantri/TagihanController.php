<?php

namespace App\Http\Controllers\Api\WaliSantri;

use App\Http\Controllers\Controller;
use App\Http\Resources\TagihanResource;
use App\Models\Pembayaran;
use App\Models\Tagihan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TagihanController extends Controller
{
    /** Tagihan seluruh anak dari wali yang login */
    public function index(Request $request)
    {
        $santriIds = $request->user()->anak()->pluck('santri.id');

        $tagihan = Tagihan::with(['santri', 'jenisTagihan', 'pembayaran'])
            ->whereIn('santri_id', $santriIds)
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return TagihanResource::collection($tagihan);
    }

    /**
     * Upload bukti transfer untuk sebuah tagihan.
     *
     * PERBAIKAN: pembuatan Pembayaran + update status Tagihan dibungkus
     * DB::transaction() (file sudah tersimpan di disk sebelum transaction
     * DB dimulai — upload file bukan operasi database sehingga tidak
     * perlu, dan tidak bisa, di-rollback bersama transaction). Sebelumnya
     * dua write DB ini terpisah: jika update status tagihan gagal setelah
     * Pembayaran berhasil dibuat, tagihan tetap berstatus lama padahal
     * sudah ada baris pembayaran 'pending' menunggu verifikasi — membuat
     * Petugas Keuangan tidak melihat tagihan ini di antrean verifikasi.
     */
    public function bayar(Request $request, Tagihan $tagihan)
    {
        // Pastikan tagihan ini benar-benar milik salah satu anak wali yang login.
        // Tanpa cek ini, wali bisa membayar tagihan santri lain hanya dengan
        // menebak ID tagihan di URL (IDOR).
        $santriIds = $request->user()->anak()->pluck('santri.id');

        abort_unless(
            $santriIds->contains($tagihan->santri_id),
            403,
            'Tagihan ini bukan milik anak Anda.'
        );

        $data = $request->validate([
            'jumlah_bayar' => ['required', 'numeric', 'min:0'],
            'bukti_transfer' => ['required', 'file', 'image', 'max:5120'],
            'tanggal_bayar' => ['required', 'date'],
        ]);

        $path = $request->file('bukti_transfer')->store('bukti-transfer', 'public');

        $pembayaran = DB::transaction(function () use ($tagihan, $request, $data, $path) {
            $pembayaran = Pembayaran::create([
                'tagihan_id' => $tagihan->id,
                'dibayar_oleh' => $request->user()->id,
                'jumlah_bayar' => $data['jumlah_bayar'],
                'bukti_transfer' => $path,
                'tanggal_bayar' => $data['tanggal_bayar'],
                'status' => 'pending',
            ]);

            $tagihan->update(['status' => 'menunggu_verifikasi']);

            return $pembayaran;
        });

        return response()->json($pembayaran, 201);
    }
}