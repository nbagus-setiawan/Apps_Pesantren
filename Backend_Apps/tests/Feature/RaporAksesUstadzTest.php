<?php

namespace Tests\Feature;

use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Santri;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RaporAksesUstadzTest extends TestCase
{
    use RefreshDatabase;

    private function buatSantriDiKelas(int $kelasId, string $nis): Santri
    {
        return Santri::create([
            'nis' => $nis,
            'nama' => 'Santri Uji Rapor',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2012-01-01',
            'kelas_id' => $kelasId,
            'tanggal_masuk' => '2026-07-01',
            'status' => 'aktif',
        ]);
    }

    public function test_ustadz_wali_kelas_bisa_lihat_rapor_santri_di_kelasnya(): void
    {
        $ustadz = User::factory()->ustadz()->create();
        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $kelas = Kelas::create([
            'nama' => 'Kelas 7A',
            'tingkat' => 'SMP',
            'wali_kelas_id' => $ustadz->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        $santri = $this->buatSantriDiKelas($kelas->id, '2026600');

        $response = $this->actingAs($ustadz, 'sanctum')
            ->getJson("/api/santri/{$santri->id}/rapor");

        $response->assertOk();
    }

    public function test_ustadz_pengajar_mapel_bisa_lihat_rapor_santri_di_kelas_yang_diajar(): void
    {
        $ustadz = User::factory()->ustadz()->create();
        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $kelas = Kelas::create([
            'nama' => 'Kelas 8B',
            'tingkat' => 'SMP',
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        MataPelajaran::create([
            'nama' => 'Fiqih',
            'kelas_id' => $kelas->id,
            'ustadz_id' => $ustadz->id,
        ]);

        $santri = $this->buatSantriDiKelas($kelas->id, '2026601');

        $response = $this->actingAs($ustadz, 'sanctum')
            ->getJson("/api/santri/{$santri->id}/rapor");

        $response->assertOk();
    }

    public function test_ustadz_tidak_bisa_lihat_rapor_santri_di_kelas_lain(): void
    {
        $ustadzTidakBerwenang = User::factory()->ustadz()->create();
        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $kelasLain = Kelas::create([
            'nama' => 'Kelas 9C',
            'tingkat' => 'SMP',
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        $santri = $this->buatSantriDiKelas($kelasLain->id, '2026602');

        $response = $this->actingAs($ustadzTidakBerwenang, 'sanctum')
            ->getJson("/api/santri/{$santri->id}/rapor");

        $response->assertUnprocessable();
    }

    public function test_admin_tetap_bisa_lihat_rapor_santri_manapun(): void
    {
        $admin = User::factory()->admin()->create();
        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $kelas = Kelas::create([
            'nama' => 'Kelas 7A',
            'tingkat' => 'SMP',
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        $santri = $this->buatSantriDiKelas($kelas->id, '2026603');

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/santri/{$santri->id}/rapor");

        $response->assertOk();
    }

    public function test_wali_santri_tidak_bisa_lihat_rapor_anak_orang_lain(): void
    {
        $wali = User::factory()->waliSantri()->create();
        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $kelas = Kelas::create([
            'nama' => 'Kelas 7A',
            'tingkat' => 'SMP',
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        $santriOrangLain = $this->buatSantriDiKelas($kelas->id, '2026604');

        $response = $this->actingAs($wali, 'sanctum')
            ->getJson("/api/santri/{$santriOrangLain->id}/rapor");

        $response->assertForbidden();
    }
}