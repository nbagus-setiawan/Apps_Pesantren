<?php

namespace Tests\Feature;

use App\Models\JenisTagihan;
use App\Models\Pembayaran;
use App\Models\Santri;
use App\Models\Tagihan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class TagihanPembayaranDuplikatTest extends TestCase
{
    use RefreshDatabase;

    private function buatWaliDenganTagihan(): array
    {
        $wali = User::factory()->waliSantri()->create();
        $admin = User::factory()->admin()->create();

        $santri = Santri::create([
            'nis' => '2026800',
            'nama' => 'Santri Uji Bayar',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2012-01-01',
            'tanggal_masuk' => '2026-07-01',
            'status' => 'aktif',
        ]);

        $santri->wali()->attach($wali->id, ['hubungan' => 'ayah']);

        $jenisTagihan = JenisTagihan::create([
            'nama' => 'SPP Bulanan',
            'nominal_default' => 500000,
            'tipe' => 'bulanan',
        ]);

        $tagihan = Tagihan::create([
            'santri_id' => $santri->id,
            'jenis_tagihan_id' => $jenisTagihan->id,
            'periode' => '2026-08',
            'nominal' => 500000,
            'jatuh_tempo' => now()->addDays(10)->toDateString(),
            'status' => 'belum_bayar',
            'dibuat_oleh' => $admin->id,
        ]);

        return [$wali, $tagihan];
    }

    public function test_wali_bisa_upload_bukti_bayar_untuk_tagihan_yang_belum_dibayar(): void
    {
        [$wali, $tagihan] = $this->buatWaliDenganTagihan();

        $response = $this->actingAs($wali, 'sanctum')
            ->postJson("/api/wali/tagihan/{$tagihan->id}/bayar", [
                'jumlah_bayar' => 500000,
                'bukti_transfer' => UploadedFile::fake()->image('bukti.jpg'),
                'tanggal_bayar' => now()->toDateString(),
            ]);

        $response->assertCreated();
        $this->assertSame('menunggu_verifikasi', $tagihan->fresh()->status);
        $this->assertSame(1, Pembayaran::where('tagihan_id', $tagihan->id)->count());
    }

    public function test_wali_tidak_bisa_upload_bukti_bayar_dua_kali_saat_masih_pending(): void
    {
        [$wali, $tagihan] = $this->buatWaliDenganTagihan();

        // Upload pertama — berhasil
        $this->actingAs($wali, 'sanctum')
            ->postJson("/api/wali/tagihan/{$tagihan->id}/bayar", [
                'jumlah_bayar' => 500000,
                'bukti_transfer' => UploadedFile::fake()->image('bukti-1.jpg'),
                'tanggal_bayar' => now()->toDateString(),
            ])
            ->assertCreated();

        // Upload kedua sebelum diverifikasi — harus ditolak
        $response = $this->actingAs($wali, 'sanctum')
            ->postJson("/api/wali/tagihan/{$tagihan->id}/bayar", [
                'jumlah_bayar' => 500000,
                'bukti_transfer' => UploadedFile::fake()->image('bukti-2.jpg'),
                'tanggal_bayar' => now()->toDateString(),
            ]);

        $response->assertUnprocessable();
        $this->assertSame(1, Pembayaran::where('tagihan_id', $tagihan->id)->count());
    }

    public function test_wali_bisa_upload_ulang_setelah_pembayaran_sebelumnya_ditolak(): void
    {
        [$wali, $tagihan] = $this->buatWaliDenganTagihan();

        $pembayaranPertama = Pembayaran::create([
            'tagihan_id' => $tagihan->id,
            'dibayar_oleh' => $wali->id,
            'jumlah_bayar' => 500000,
            'bukti_transfer' => 'bukti-transfer/lama.jpg',
            'tanggal_bayar' => now(),
            'status' => 'ditolak',
        ]);
        $tagihan->update(['status' => 'belum_bayar']);

        $response = $this->actingAs($wali, 'sanctum')
            ->postJson("/api/wali/tagihan/{$tagihan->id}/bayar", [
                'jumlah_bayar' => 500000,
                'bukti_transfer' => UploadedFile::fake()->image('bukti-baru.jpg'),
                'tanggal_bayar' => now()->toDateString(),
            ]);

        $response->assertCreated();
        $this->assertSame(2, Pembayaran::where('tagihan_id', $tagihan->id)->count());
        $this->assertSame('menunggu_verifikasi', $tagihan->fresh()->status);
    }

    public function test_wali_tidak_bisa_bayar_tagihan_milik_santri_orang_lain(): void
    {
        [$waliPemilik, $tagihan] = $this->buatWaliDenganTagihan();
        $waliLain = User::factory()->waliSantri()->create();

        $response = $this->actingAs($waliLain, 'sanctum')
            ->postJson("/api/wali/tagihan/{$tagihan->id}/bayar", [
                'jumlah_bayar' => 500000,
                'bukti_transfer' => UploadedFile::fake()->image('bukti.jpg'),
                'tanggal_bayar' => now()->toDateString(),
            ]);

        $response->assertForbidden();
    }
}