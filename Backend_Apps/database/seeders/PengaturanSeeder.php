<?php

namespace Database\Seeders;

use App\Models\Pengaturan;
use Illuminate\Database\Seeder;

class PengaturanSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'nama_pesantren' => 'Pesantren Contoh',
            'ambang_batas_poin_pelanggaran' => '100',
            'qr_durasi_jam' => '24',
        ];

        foreach ($defaults as $key => $value) {
            Pengaturan::firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}