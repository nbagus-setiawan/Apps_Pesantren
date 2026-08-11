<?php

namespace App\Providers;

use App\Models\Absensi;
use App\Models\Pengumuman;
use App\Models\Perizinan;
use App\Models\Tagihan;
use App\Observers\AbsensiObserver;
use App\Observers\PengumumanObserver;
use App\Observers\PerizinanObserver;
use App\Observers\TagihanObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Tagihan::observe(TagihanObserver::class);
        Perizinan::observe(PerizinanObserver::class);
        Absensi::observe(AbsensiObserver::class);
        Pengumuman::observe(PengumumanObserver::class);
    }
}