<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TahunAjaran extends Model
{
    protected $table = 'tahun_ajaran';
    protected $fillable = ['nama', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class);
    }
}
