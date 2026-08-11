<?php

namespace Tests\Feature;

use App\Models\PenugasanUstadz;
use App\Models\Perizinan;
use App\Models\Santri;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PerizinanQrTest extends TestCase
{
    use RefreshDatabase;

    public function test_qr_dibuat_otomatis_saat_perizinan_disetujui(): void
    {
        $adminPenunjuk = User::factory()->admin()->create();
        $ustadz = User::factory()->ustadz()->create();
        PenugasanUstadz::create([
            'ustadz_id' => $ustadz->id,
            'jenis_tugas' => 'perizinan',
            'ditunjuk_oleh' => $adminPenunjuk->id,
            'is_active' => true,
        ]);

        $wali = User::factory()->waliSantri()->create();
        $santri = Santri::create([
            'nis' => '2026001',
            'nama' => 'Santri Uji',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2012-01-01',
            'tanggal_masuk' => '2026-07-01',
            'status' => 'aktif',
        ]);

        $perizinan = Perizinan::create([
            'santri_id' => $santri->id,
            'diajukan_oleh' => $wali->id,
            'jenis' => 'izin_pulang',
            'tanggal_mulai' => now(),
            'tanggal_selesai' => now()->addDay(),
            'alasan' => 'Acara keluarga',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($ustadz, 'sanctum')
            ->postJson("/api/ustadz/perizinan/{$perizinan->id}/proses", ['status' => 'disetujui']);

        $response->assertOk();
        $this->assertNotNull($perizinan->fresh()->kode_qr);
    }

    public function test_ustadz_tanpa_penugasan_tidak_bisa_proses_perizinan(): void
    {
        $ustadz = User::factory()->ustadz()->create(); // tanpa penugasan aktif
        $wali = User::factory()->waliSantri()->create();
        $santri = Santri::create([
            'nis' => '2026002',
            'nama' => 'Santri Uji 2',
            'jenis_kelamin' => 'P',
            'tanggal_lahir' => '2012-02-02',
            'tanggal_masuk' => '2026-07-01',
            'status' => 'aktif',
        ]);

        $perizinan = Perizinan::create([
            'santri_id' => $santri->id,
            'diajukan_oleh' => $wali->id,
            'jenis' => 'sakit',
            'tanggal_mulai' => now(),
            'tanggal_selesai' => now()->addDay(),
            'alasan' => 'Demam',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($ustadz, 'sanctum')
            ->postJson("/api/ustadz/perizinan/{$perizinan->id}/proses", ['status' => 'disetujui']);

        $response->assertUnprocessable();
    }
}
