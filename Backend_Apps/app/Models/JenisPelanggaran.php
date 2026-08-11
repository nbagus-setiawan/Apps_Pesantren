<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JenisPelanggaran extends Model
{
    protected $table = 'jenis_pelanggaran';
    protected $fillable = ['nama', 'poin', 'kategori'];

    public function pelanggaran(): HasMany
    {
        return $this->hasMany(Pelanggaran::class);
    }
}
