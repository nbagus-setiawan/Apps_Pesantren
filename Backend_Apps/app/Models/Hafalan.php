<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Hafalan extends Model
{
    protected $table = 'hafalan';
    protected $fillable = [
        'santri_id', 'surah', 'ayat_mulai', 'ayat_selesai',
        'tanggal', 'status', 'catatan', 'dicatat_oleh',
    ];
    protected $casts = ['tanggal' => 'date'];

    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }

    public function dicatatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}
