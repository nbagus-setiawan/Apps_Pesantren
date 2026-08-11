<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatatanPerkembangan extends Model
{
    protected $table = 'catatan_perkembangan';
    protected $fillable = ['santri_id', 'ustadz_id', 'semester', 'tahun_ajaran_id', 'isi', 'tanggal'];
    protected $casts = ['tanggal' => 'date'];

    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }

    public function ustadz(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ustadz_id');
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }
}
