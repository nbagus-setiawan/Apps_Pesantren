<?php

namespace App\Http\Controllers\Api\WaliSantri;

use App\Http\Controllers\Controller;
use App\Http\Resources\TagihanResource;
use App\Models\Pembayaran;
use App\Models\Tagihan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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
     * PERBAIKAN (baru): tambahan guard agar tidak ada lebih dari satu
     * Pembayaran berstatus 'pending' untuk tagihan yang sama pada saat
     * bersamaan. Sebelumnya, kalau wali upload bukti dua kali sebelum
     * petugas keuangan sempat memverifikasi (mis. double-submit dari
     * aplikasi mobile, atau upload ulang tanpa sadar sudah pernah
     * upload), akan tercipta beberapa baris Pembayaran 'pending' untuk
     * satu tagihan — membingungkan Petugas Keuangan saat verifikasi
     * (mana yang harus diproses?) dan berisiko tagihan divalidasi dua
     * kali dari dua bukti berbeda.
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

        $sudahAdaPending = Pembayaran::where('tagihan_id', $tagihan->id)
            ->where('status', 'pending')
            ->exists();

        if ($sudahAdaPending) {
            throw ValidationException::withMessages([
                'tagihan_id' => ['Tagihan ini sudah memiliki bukti transfer yang sedang menunggu verifikasi.'],
            ]);
        }

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