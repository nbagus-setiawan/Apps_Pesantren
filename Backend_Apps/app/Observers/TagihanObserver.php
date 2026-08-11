<?php

namespace App\Observers;

use App\Models\Notifikasi;
use App\Models\Tagihan;

class TagihanObserver
{
    /** Saat tagihan baru dibuat, kirim notifikasi ke seluruh wali dari santri terkait */
    public function created(Tagihan $tagihan): void
    {
        $tagihan->load('santri.wali', 'jenisTagihan');

        foreach ($tagihan->santri->wali as $wali) {
            Notifikasi::create([
                'user_id' => $wali->id,
                'judul' => 'Tagihan Baru',
                'isi' => "Tagihan {$tagihan->jenisTagihan->nama} periode {$tagihan->periode} untuk {$tagihan->santri->nama} telah terbit.",
                'tipe' => 'tagihan',
            ]);
        }
    }

    /** Saat status tagihan berubah, beri tahu wali sesuai perubahan status */
    public function updated(Tagihan $tagihan): void
    {
        if (! $tagihan->isDirty('status')) {
            return;
        }

        if ($tagihan->status === 'lunas') {
            $tagihan->load('santri.wali');

            foreach ($tagihan->santri->wali as $wali) {
                Notifikasi::create([
                    'user_id' => $wali->id,
                    'judul' => 'Pembayaran Terverifikasi',
                    'isi' => "Tagihan {$tagihan->periode} untuk {$tagihan->santri->nama} sudah lunas.",
                    'tipe' => 'tagihan',
                ]);
            }
        }

        if ($tagihan->status === 'telat') {
            $tagihan->load('santri.wali');

            foreach ($tagihan->santri->wali as $wali) {
                Notifikasi::create([
                    'user_id' => $wali->id,
                    'judul' => 'Tagihan Telat',
                    'isi' => "Tagihan {$tagihan->periode} untuk {$tagihan->santri->nama} sudah melewati jatuh tempo dan berstatus telat.",
                    'tipe' => 'tagihan',
                ]);
            }
        }
    }
}