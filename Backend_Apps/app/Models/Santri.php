<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Santri extends Model
{
    protected $table = 'santri';
    protected $fillable = [
        'nis', 'nama', 'jenis_kelamin', 'tanggal_lahir', 'alamat', 'foto',
        'kelas_id', 'kamar_id', 'status', 'tanggal_masuk',
    ];
    protected $casts = [
        'tanggal_lahir' => 'date',
        'tanggal_masuk' => 'date',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function kamar(): BelongsTo
    {
        return $this->belongsTo(Kamar::class);
    }

    public function wali(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'wali_santri')->withPivot('hubungan')->withTimestamps();
    }

    public function riwayatKelas(): HasMany
    {
        return $this->hasMany(RiwayatKelas::class);
    }

    public function riwayatKamar(): HasMany
    {
        return $this->hasMany(RiwayatKamar::class);
    }

    public function absensi(): HasMany
    {
        return $this->hasMany(Absensi::class);
    }

    public function nilai(): HasMany
    {
        return $this->hasMany(Nilai::class);
    }

    public function catatanPerkembangan(): HasMany
    {
        return $this->hasMany(CatatanPerkembangan::class);
    }

    public function hafalan(): HasMany
    {
        return $this->hasMany(Hafalan::class);
    }

    public function pelanggaran(): HasMany
    {
        return $this->hasMany(Pelanggaran::class);
    }

    /** Total poin pelanggaran (bisa difilter query di controller) */
    public function totalPoinPelanggaran(): int
    {
        return (int) $this->pelanggaran()->sum('poin_saat_itu');
    }

    public function tagihan(): HasMany
    {
        return $this->hasMany(Tagihan::class);
    }

    public function perizinan(): HasMany
    {
        return $this->hasMany(Perizinan::class);
    }
}
