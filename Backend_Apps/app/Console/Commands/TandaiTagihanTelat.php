<?php

namespace App\Console\Commands;

use App\Models\Tagihan;
use Illuminate\Console\Command;

class TandaiTagihanTelat extends Command
{
    /**
     * Nama & signature command console.
     */
    protected $signature = 'tagihan:tandai-telat';

    /**
     * Deskripsi command console.
     */
    protected $description = 'Tandai tagihan dengan status belum_bayar yang sudah lewat jatuh tempo menjadi telat.';

    public function handle(): int
    {
        // Hanya tagihan yang masih 'belum_bayar' dan jatuh tempo sudah lewat
        // hari ini yang ditandai 'telat'. Tagihan yang sedang menunggu
        // verifikasi pembayaran (menunggu_verifikasi) TIDAK disentuh, karena
        // wali sudah upload bukti bayar dan menunggu proses petugas keuangan
        // — bukan kelalaian wali.
        $jumlah = Tagihan::where('status', 'belum_bayar')
            ->whereDate('jatuh_tempo', '<', now()->toDateString())
            ->get()
            ->each(function (Tagihan $tagihan) {
                // update() satu per satu (bukan mass-update) agar
                // TagihanObserver::updated() tetap terpicu untuk setiap
                // baris, sehingga notifikasi ke wali (jika nanti ditambah
                // untuk status telat) tetap berjalan konsisten dengan
                // pola observer yang sudah ada di aplikasi ini.
                $tagihan->update(['status' => 'telat']);
            })
            ->count();

        $this->info("Berhasil menandai {$jumlah} tagihan menjadi status 'telat'.");

        return self::SUCCESS;
    }
}