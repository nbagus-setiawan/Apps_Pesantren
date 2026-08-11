<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Generate tagihan bulanan (SPP dll) otomatis setiap tanggal 1 jam 00:05
Schedule::command('tagihan:generate-bulanan')->monthlyOn(1, '00:05');
