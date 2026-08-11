<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model eksplisit untuk pivot wali_santri (dipakai jika perlu query langsung ke tabel pivot,
 * relasi many-to-many utama tetap didefinisikan via User::anak() dan Santri::wali()).
 */
class WaliSantriPivot extends Model
{
    protected $table = 'wali_santri';
    protected $fillable = ['user_id', 'santri_id', 'hubungan'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function santri()
    {
        return $this->belongsTo(Santri::class);
    }
}
