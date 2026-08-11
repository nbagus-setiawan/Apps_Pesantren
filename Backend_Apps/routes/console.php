<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// CATATAN (PRD v1.4, section 10): pembuatan tagihan SPP bersifat MANUAL,
// dilakukan oleh Ustadz yang ditunjuk Admin sebagai Petugas Keuangan —
// bukan auto-generate oleh sistem. Karena itu tidak ada Schedule::command()
// di sini untuk generate tagihan bulanan. Lihat:
//   App\Http\Controllers\Api\Ustadz\TagihanController::generateBulanan()
// yang dipanggil manual lewat POST /api/ustadz/tagihan/generate-bulanan
// oleh Ustadz dengan penugasan_ustadz.jenis_tugas = 'keuangan'.
