<?php

namespace App\Observers;

use App\Models\Notifikasi;
use App\Models\Perizinan;

class PerizinanObserver
{
    public function updated(Perizinan $perizinan): void
    {
        if (! $perizinan->isDirty('status') || $perizinan->status === 'pending') {
            return;
        }

        $label = $perizinan->status === 'disetujui' ? 'disetujui' : 'ditolak';

        Notifikasi::create([
            'user_id' => $perizinan->diajukan_oleh,
            'judul' => 'Perizinan ' . ucfirst($label),
            'isi' => "Pengajuan izin untuk {$perizinan->santri->nama} telah {$label}.",
            'tipe' => 'perizinan',
        ]);
    }
}
