<?php

namespace Tests\Feature;

use App\Models\JenisTagihan;
use App\Models\PenugasanUstadz;
use App\Models\Pembayaran;
use App\Models\Santri;
use App\Models\Tagihan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PembayaranVerifikasiTest extends TestCase
{
    use RefreshDatabase;

    private function buatPetugasKeuangan(): User
    {
        $admin = User::factory()->admin()->create();
        $petugas = User::factory()->ustadz()->create();

        PenugasanUstadz::create([
            'ustadz_id' => $petugas->id,
            'jenis_tugas' => 'keuangan',
            'ditunjuk_oleh' => $admin->id,
            'is_active' => true,
        ]);

        return $petugas;
    }

    private function buatTagihanMenungguVerifikasi(string $jatuhTempo): array
    {
        $wali = User::factory()->waliSantri()->create();

        $santri = Santri::create([
            'nis' => '2026500',
            'nama' => 'Santri Uji Pembayaran',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2012-01-01',
            'tanggal_masuk' => '2026-07-01',
            'status' => 'aktif',
        ]);

        $jenisTagihan = JenisTagihan::create([
            'nama' => 'SPP Bulanan',
            'nominal_default' => 500000,
            'tipe' => 'bulanan',
        ]);

        $dibuatOleh = User::factory()->admin()->create();

        $tagihan = Tagihan::create([
            'santri_id' => $santri->id,
            'jenis_tagihan_id' => $jenisTagihan->id,
            'periode' => '2026-08',
            'nominal' => 500000,
            'jatuh_tempo' => $jatuhTempo,
            'status' => 'menunggu_verifikasi',
            'dibuat_oleh' => $dibuatOleh->id,
        ]);

        $pembayaran = Pembayaran::create([
            'tagihan_id' => $tagihan->id,
            'dibayar_oleh' => $wali->id,
            'jumlah_bayar' => 500000,
            'bukti_transfer' => 'bukti-transfer/dummy.jpg',
            'tanggal_bayar' => now(),
            'status' => 'pending',
        ]);

        return [$tagihan, $pembayaran];
    }

    public function test_verifikasi_diterima_mengubah_tagihan_menjadi_lunas(): void
    {
        $petugas = $this->buatPetugasKeuangan();
        [$tagihan, $pembayaran] = $this->buatTagihanMenungguVerifikasi(now()->addDays(5)->toDateString());

        $response = $this->actingAs($petugas, 'sanctum')
            ->postJson("/api/ustadz/pembayaran/{$pembayaran->id}/verifikasi", [
                'status' => 'diverifikasi',
            ]);

        $response->assertOk();
        $this->assertSame('lunas', $tagihan->fresh()->status);
        $this->assertSame('diverifikasi', $pembayaran->fresh()->status);
    }

    public function test_verifikasi_ditolak_mengembalikan_tagihan_ke_belum_bayar_jika_belum_jatuh_tempo(): void
    {
        $petugas = $this->buatPetugasKeuangan();
        [$tagihan, $pembayaran] = $this->buatTagihanMenungguVerifikasi(now()->addDays(5)->toDateString());

        $response = $this->actingAs($petugas, 'sanctum')
            ->postJson("/api/ustadz/pembayaran/{$pembayaran->id}/verifikasi", [
                'status' => 'ditolak',
                'catatan_petugas' => 'Bukti transfer tidak jelas.',
            ]);

        $response->assertOk();
        $this->assertSame('belum_bayar', $tagihan->fresh()->status);
        $this->assertSame('ditolak', $pembayaran->fresh()->status);
    }

    public function test_verifikasi_ditolak_mengembalikan_tagihan_ke_telat_jika_sudah_lewat_jatuh_tempo(): void
    {
        $petugas = $this->buatPetugasKeuangan();
        [$tagihan, $pembayaran] = $this->buatTagihanMenungguVerifikasi(now()->subDays(3)->toDateString());

        $response = $this->actingAs($petugas, 'sanctum')
            ->postJson("/api/ustadz/pembayaran/{$pembayaran->id}/verifikasi", [
                'status' => 'ditolak',
            ]);

        $response->assertOk();
        $this->assertSame('telat', $tagihan->fresh()->status);
    }

    public function test_ustadz_tanpa_penugasan_keuangan_tidak_bisa_verifikasi(): void
    {
        $ustadzBiasa = User::factory()->ustadz()->create(); // tanpa penugasan aktif
        [$tagihan, $pembayaran] = $this->buatTagihanMenungguVerifikasi(now()->addDays(5)->toDateString());

        $response = $this->actingAs($ustadzBiasa, 'sanctum')
            ->postJson("/api/ustadz/pembayaran/{$pembayaran->id}/verifikasi", [
                'status' => 'diverifikasi',
            ]);

        $response->assertUnprocessable();
        $this->assertSame('menunggu_verifikasi', $tagihan->fresh()->status);
    }
}