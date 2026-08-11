<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'phone', 'password', 'role', 'avatar', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // ── Role helpers ──────────────────────────────────────────
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isUstadz(): bool
    {
        return $this->role === 'ustadz';
    }

    public function isWaliSantri(): bool
    {
        return $this->role === 'wali_santri';
    }

    /** Cek apakah user (ustadz) sedang aktif ditugaskan sebagai Penanggung Jawab Perizinan / Petugas Keuangan */
    public function punyaTugasAktif(string $jenisTugas): bool
    {
        return $this->penugasan()->where('jenis_tugas', $jenisTugas)->where('is_active', true)->exists();
    }

    // ── Relasi ────────────────────────────────────────────────
    public function dataKepegawaian(): HasOne
    {
        return $this->hasOne(DataKepegawaian::class);
    }

    public function izinUstadz(): HasMany
    {
        return $this->hasMany(IzinUstadz::class, 'ustadz_id');
    }

    public function penugasan(): HasMany
    {
        return $this->hasMany(PenugasanUstadz::class, 'ustadz_id');
    }

    /** Santri yang diampu sebagai wali kelas */
    public function kelasDiampu(): HasMany
    {
        return $this->hasMany(Kelas::class, 'wali_kelas_id');
    }

    /** Santri milik wali ini (many-to-many) */
    public function anak(): BelongsToMany
    {
        return $this->belongsToMany(Santri::class, 'wali_santri')->withPivot('hubungan')->withTimestamps();
    }

    public function notifikasi(): HasMany
    {
        return $this->hasMany(Notifikasi::class);
    }
}
