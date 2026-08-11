<?php

namespace App\Console\Commands;

use App\Models\JenisTagihan;
use App\Models\Santri;
use App\Models\Tagihan;
use Illuminate\Console\Command;

class GenerateTagihanBulanan extends Command
{
    protected $signature = 'tagihan:generate-bulanan';

    protected $description = 'Generate tagihan bulanan (mis. SPP) untuk seluruh santri aktif pada periode berjalan';

    public function handle(): int
    {
        $periode = now()->format('Y-m');
        $jenisBulanan = JenisTagihan::where('tipe', 'bulanan')->get();
        $santriAktif = Santri::where('status', 'aktif')->pluck('id');

        $totalDibuat = 0;

        foreach ($jenisBulanan as $jenis) {
            foreach ($santriAktif as $santriId) {
                $sudahAda = Tagihan::where('santri_id', $santriId)
                    ->where('jenis_tagihan_id', $jenis->id)
                    ->where('periode', $periode)
                    ->exists();

                if ($sudahAda) {
                    continue;
                }

                Tagihan::create([
                    'santri_id' => $santriId,
                    'jenis_tagihan_id' => $jenis->id,
                    'periode' => $periode,
                    'nominal' => $jenis->nominal_default,
                    'jatuh_tempo' => now()->endOfMonth(),
                    'status' => 'belum_bayar',
                    'dibuat_oleh' => 1, // sistem/admin pertama; sesuaikan jika ada user "sistem" khusus
                ]);

                $totalDibuat++;
            }
        }

        $this->info("Berhasil membuat {$totalDibuat} tagihan untuk periode {$periode}.");

        return self::SUCCESS;
    }
}
