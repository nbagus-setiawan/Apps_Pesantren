<?php

namespace Database\Seeders;

use App\Models\JenisPelanggaran;
use App\Models\JenisTagihan;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Akun default untuk setiap role
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@pesantren.test',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Ustadz Contoh',
            'email' => 'ustadz@pesantren.test',
            'password' => bcrypt('password'),
            'role' => 'ustadz',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Wali Santri Contoh',
            'email' => 'wali@pesantren.test',
            'password' => bcrypt('password'),
            'role' => 'wali_santri',
            'is_active' => true,
        ]);

        TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        foreach ([
            ['nama' => 'Terlambat sholat berjamaah', 'poin' => 5, 'kategori' => 'ringan'],
            ['nama' => 'Tidak mengikuti kegiatan wajib', 'poin' => 10, 'kategori' => 'sedang'],
            ['nama' => 'Berkelahi', 'poin' => 50, 'kategori' => 'berat'],
        ] as $jp) {
            JenisPelanggaran::create($jp);
        }

        foreach ([
            ['nama' => 'SPP Bulanan', 'nominal_default' => 500000, 'tipe' => 'bulanan'],
            ['nama' => 'Uang Pangkal', 'nominal_default' => 5000000, 'tipe' => 'sekali'],
            ['nama' => 'Kegiatan Tahunan', 'nominal_default' => 750000, 'tipe' => 'tahunan'],
        ] as $jt) {
            JenisTagihan::create($jt);
        }

        $this->call(PengaturanSeeder::class);
    }
}
