<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiwayatKamar extends Model
{
    protected $table = 'riwayat_kamar';
    protected $fillable = ['santri_id', 'kamar_id', 'tanggal_mulai', 'tanggal_selesai', 'dipindahkan_oleh'];
    protected $casts = ['tanggal_mulai' => 'date', 'tanggal_selesai' => 'date'];

    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }

    public function kamar(): BelongsTo
    {
        return $this->belongsTo(Kamar::class);
    }
}
