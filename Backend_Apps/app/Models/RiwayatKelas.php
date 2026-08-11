<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiwayatKelas extends Model
{
    protected $table = 'riwayat_kelas';
    protected $fillable = [
        'santri_id', 'kelas_id', 'tahun_ajaran_id', 'tanggal_mulai',
        'tanggal_selesai', 'keterangan', 'dipindahkan_oleh',
    ];
    protected $casts = ['tanggal_mulai' => 'date', 'tanggal_selesai' => 'date'];

    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function dipindahkanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dipindahkan_oleh');
    }
}
