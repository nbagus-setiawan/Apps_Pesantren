<?php

namespace App\Observers;

use App\Models\Notifikasi;
use App\Models\Pengumuman;
use App\Models\User;

class PengumumanObserver
{
    public function created(Pengumuman $pengumuman): void
    {
        $query = User::where('is_active', true);

        if ($pengumuman->target_role !== 'semua') {
            $query->where('role', $pengumuman->target_role);
        }

        if ($pengumuman->target_kelas_id) {
            // hanya wali dari santri di kelas tsb
            $query->whereHas('anak', fn ($q) => $q->where('kelas_id', $pengumuman->target_kelas_id));
        }

        $query->chunkById(200, function ($users) use ($pengumuman) {
            foreach ($users as $user) {
                Notifikasi::create([
                    'user_id' => $user->id,
                    'judul' => $pengumuman->judul,
                    'isi' => \Illuminate\Support\Str::limit($pengumuman->isi, 150),
                    'tipe' => 'pengumuman',
                ]);
            }
        });
    }
}
