<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IzinUstadz extends Model
{
    protected $table = 'izin_ustadz';
    protected $fillable = [
        'ustadz_id', 'jenis', 'tanggal_mulai', 'tanggal_selesai',
        'alasan', 'status', 'disetujui_oleh',
    ];
    protected $casts = ['tanggal_mulai' => 'date', 'tanggal_selesai' => 'date'];

    public function ustadz(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ustadz_id');
    }

    public function disetujuiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }
}
