<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kamar extends Model
{
    protected $table = 'kamar';
    protected $fillable = ['asrama_id', 'nama', 'kapasitas'];

    public function asrama(): BelongsTo
    {
        return $this->belongsTo(Asrama::class);
    }

    public function santri(): HasMany
    {
        return $this->hasMany(Santri::class);
    }

    public function riwayat(): HasMany
    {
        return $this->hasMany(RiwayatKamar::class);
    }
}
