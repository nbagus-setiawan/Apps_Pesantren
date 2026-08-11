<?php

namespace Tests\Feature;

use App\Models\PenugasanUstadz;
use App\Models\Pengaturan;
use App\Models\Perizinan;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QrDurasiTest extends TestCase
{
    use RefreshDatabase;

    private function buatUstadzPenanggungJawabPerizinan(): User
    {
        $adminPenunjuk = User::factory()->admin()->create();
        $ustadz = User::factory()->ustadz()->create();

        PenugasanUstadz::create([
            'ustadz_id' => $ustadz->id,
            'jenis_tugas' => 'perizinan',
            'ditunjuk_oleh' => $adminPenunjuk->id,
            'is_active' => true,
        ]);

        return $ustadz;
    }

    private function buatSantri(string $nis): Santri
    {
        return Santri::create([
            'nis' => $nis,
            'nama' => 'Santri Uji',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2012-01-01',
            'tanggal_masuk' => '2026-07-01',
            'status' => 'aktif',
        ]);
    }

    private function ajukanPerizinan(Santri $santri): Perizinan
    {
        $wali = User::factory()->waliSantri()->create();

        return Perizinan::create([
            'santri_id' => $santri->id,
            'diajukan_oleh' => $wali->id,
            'jenis' => 'izin_pulang',
            'tanggal_mulai' => now(),
            'tanggal_selesai' => now()->addDay(),
            'alasan' => 'Acara keluarga',
            'status' => 'pending',
        ]);
    }

    public function test_qr_berlaku_24_jam_jika_pengaturan_belum_pernah_diset(): void
    {
        // Sengaja TIDAK memanggil PengaturanSeeder, untuk memastikan default
        // 24 jam tetap berfungsi walau baris 'qr_durasi_jam' belum ada sama
        // sekali di tabel pengaturan.
        $ustadz = $this->buatUstadzPenanggungJawabPerizinan();
        $santri = $this->buatSantri('2026200');
        $perizinan = $this->ajukanPerizinan($santri);

        $this->actingAs($ustadz, 'sanctum')
            ->postJson("/api/ustadz/perizinan/{$perizinan->id}/proses", ['status' => 'disetujui'])
            ->assertOk();

        $perizinan->refresh();

        $this->assertNotNull($perizinan->qr_berlaku_sampai);
        $this->assertEqualsWithDelta(
            now()->addHours(24)->timestamp,
            $perizinan->qr_berlaku_sampai->timestamp,
            5 // toleransi 5 detik untuk waktu eksekusi test
        );
    }

    public function test_qr_mengikuti_durasi_kustom_dari_pengaturan_admin(): void
    {
        // Admin mengatur durasi QR menjadi 48 jam (bukan default 24 jam).
        Pengaturan::set('qr_durasi_jam', '48');

        $ustadz = $this->buatUstadzPenanggungJawabPerizinan();
        $santri = $this->buatSantri('2026201');
        $perizinan = $this->ajukanPerizinan($santri);

        $this->actingAs($ustadz, 'sanctum')
            ->postJson("/api/ustadz/perizinan/{$perizinan->id}/proses", ['status' => 'disetujui'])
            ->assertOk();

        $perizinan->refresh();

        $this->assertEqualsWithDelta(
            now()->addHours(48)->timestamp,
            $perizinan->qr_berlaku_sampai->timestamp,
            5
        );
    }

    public function test_qr_dengan_durasi_pendek_kedaluwarsa_sesuai_pengaturan(): void
    {
        // Durasi 1 jam — untuk memastikan qrMasihBerlaku() ikut bereaksi
        // terhadap pengaturan durasi, bukan cuma kolom qr_berlaku_sampai saja.
        Pengaturan::set('qr_durasi_jam', '1');

        $ustadz = $this->buatUstadzPenanggungJawabPerizinan();
        $santri = $this->buatSantri('2026202');
        $perizinan = $this->ajukanPerizinan($santri);

        $this->actingAs($ustadz, 'sanctum')
            ->postJson("/api/ustadz/perizinan/{$perizinan->id}/proses", ['status' => 'disetujui'])
            ->assertOk();

        $perizinan->refresh();
        $this->assertTrue($perizinan->qrMasihBerlaku());

        // Majukan waktu 2 jam ke depan — QR seharusnya sudah kedaluwarsa
        // karena durasi yang diatur cuma 1 jam.
        $this->travel(2)->hours();

        $this->assertFalse($perizinan->fresh()->qrMasihBerlaku());
    }
}
