<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asrama extends Model
{
    protected $table = 'asrama';
    protected $fillable = ['nama', 'pembina_id'];

    public function pembina(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pembina_id');
    }

    public function kamar(): HasMany
    {
        return $this->hasMany(Kamar::class);
    }
}
