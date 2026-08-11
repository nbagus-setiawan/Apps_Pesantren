<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// CATATAN (PRD v1.4, section 10): pembuatan tagihan SPP bersifat MANUAL,
// dilakukan oleh Ustadz yang ditunjuk Admin sebagai Petugas Keuangan —
// bukan auto-generate oleh sistem. Karena itu tidak ada Schedule::command()
// untuk generate tagihan bulanan. Lihat:
//   App\Http\Controllers\Api\Ustadz\TagihanController::generateBulanan()
// yang dipanggil manual lewat POST /api/ustadz/tagihan/generate-bulanan
// oleh Ustadz dengan penugasan_ustadz.jenis_tugas = 'keuangan'.
//
// BERBEDA dengan pembuatan tagihan, PENANDAAN status 'telat' TIDAK
// membuat tagihan baru — hanya mengubah status tagihan yang sudah ada dan
// lewat jatuh tempo. Ini murni housekeeping data, bukan keputusan bisnis
// yang perlu campur tangan manual Petugas Keuangan, sehingga aman untuk
// dijadwalkan otomatis setiap hari.
Schedule::command('tagihan:tandai-telat')->dailyAt('00:05');