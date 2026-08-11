<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kegiatan extends Model
{
    protected $table = 'kegiatan';
    protected $fillable = ['judul', 'deskripsi', 'tanggal_mulai', 'tanggal_selesai', 'lokasi'];
    protected $casts = ['tanggal_mulai' => 'datetime', 'tanggal_selesai' => 'datetime'];
}
