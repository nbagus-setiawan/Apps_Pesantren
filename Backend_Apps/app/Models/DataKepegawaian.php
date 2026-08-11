<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataKepegawaian extends Model
{
    protected $table = 'data_kepegawaian';
    protected $fillable = [
        'user_id', 'nip_nuptk', 'alamat', 'pendidikan_terakhir',
        'tanggal_mulai_tugas', 'status_kepegawaian',
    ];
    protected $casts = ['tanggal_mulai_tugas' => 'date'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
