<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenugasanUstadz extends Model
{
    protected $table = 'penugasan_ustadz';
    protected $fillable = ['ustadz_id', 'jenis_tugas', 'ditunjuk_oleh', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function ustadz(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ustadz_id');
    }

    public function ditunjukOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ditunjuk_oleh');
    }
}
