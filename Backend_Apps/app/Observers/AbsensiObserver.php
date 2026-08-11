<?php

namespace App\Observers;

use App\Models\Absensi;
use App\Models\Notifikasi;

class AbsensiObserver
{
    /** Jika santri tercatat alpa, beri tahu wali agar bisa segera ditindaklanjuti */
    public function created(Absensi $absensi): void
    {
        $this->notifJikaAlpa($absensi);
    }

    public function updated(Absensi $absensi): void
    {
        if ($absensi->isDirty('status')) {
            $this->notifJikaAlpa($absensi);
        }
    }

    private function notifJikaAlpa(Absensi $absensi): void
    {
        if ($absensi->status !== 'alpa') {
            return;
        }

        $absensi->load('santri.wali');

        foreach ($absensi->santri->wali as $wali) {
            Notifikasi::create([
                'user_id' => $wali->id,
                'judul' => 'Santri Tidak Hadir',
                'isi' => "{$absensi->santri->nama} tercatat alpa pada {$absensi->tanggal->format('d-m-Y')}.",
                'tipe' => 'absensi',
            ]);
        }
    }
}
