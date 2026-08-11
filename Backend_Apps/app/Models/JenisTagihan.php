<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JenisTagihan extends Model
{
    protected $table = 'jenis_tagihan';
    protected $fillable = ['nama', 'nominal_default', 'tipe'];

    public function tagihan(): HasMany
    {
        return $this->hasMany(Tagihan::class);
    }
}
