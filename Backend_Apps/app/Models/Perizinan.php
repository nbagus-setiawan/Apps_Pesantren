<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Perizinan extends Model
{
    protected $table = 'perizinan';
    protected $fillable = [
        'santri_id', 'diajukan_oleh', 'jenis', 'tanggal_mulai', 'tanggal_selesai',
        'alasan', 'status', 'diproses_oleh', 'catatan',
        'kode_qr', 'qr_berlaku_sampai', 'qr_digunakan_at',
    ];
    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'qr_berlaku_sampai' => 'datetime',
        'qr_digunakan_at' => 'datetime',
    ];

    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class);
    }

    public function diajukanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diajukan_oleh');
    }

    public function diprosesOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diproses_oleh');
    }

    /**
     * Generate kode QR unik untuk penjemputan. Masa berlaku mengikuti
     * pengaturan Admin (`pengaturan.qr_durasi_jam` — PRD §4.1: "Setting
     * durasi berlaku kode QR"), default 24 jam jika belum pernah diatur
     * (lihat PengaturanSeeder).
     */
    public function buatKodeQr(): string
    {
        $kode = Str::uuid()->toString();
        $jamBerlaku = (int) Pengaturan::get('qr_durasi_jam', 24);

        $this->update([
            'kode_qr' => $kode,
            'qr_berlaku_sampai' => now()->addHours($jamBerlaku),
        ]);

        return $kode;
    }

    public function qrMasihBerlaku(): bool
    {
        return $this->kode_qr
            && ! $this->qr_digunakan_at
            && $this->qr_berlaku_sampai
            && $this->qr_berlaku_sampai->isFuture();
    }
}