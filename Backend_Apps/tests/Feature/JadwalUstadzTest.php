<?php

namespace Tests\Feature;

use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JadwalUstadzTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_bisa_melihat_jadwal_ustadz_sebagai_wali_kelas(): void
    {
        $admin = User::factory()->admin()->create();
        $ustadz = User::factory()->ustadz()->create();
        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $kelas = Kelas::create([
            'nama' => 'Kelas 7A',
            'tingkat' => 'SMP',
            'wali_kelas_id' => $ustadz->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/kepegawaian/{$ustadz->id}/jadwal");

        $response->assertOk()
            ->assertJsonPath('ustadz.id', $ustadz->id)
            ->assertJsonCount(1, 'wali_kelas')
            ->assertJsonPath('wali_kelas.0.kelas_id', $kelas->id)
            ->assertJsonPath('wali_kelas.0.nama_kelas', 'Kelas 7A')
            ->assertJsonPath('wali_kelas.0.tahun_ajaran', '2026/2027')
            ->assertJsonCount(0, 'mata_pelajaran');
    }

    public function test_admin_bisa_melihat_jadwal_ustadz_sebagai_pengajar_mapel(): void
    {
        $admin = User::factory()->admin()->create();
        $ustadz = User::factory()->ustadz()->create();
        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $kelas = Kelas::create([
            'nama' => 'Kelas 8B',
            'tingkat' => 'SMP',
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        $mapel = MataPelajaran::create([
            'nama' => 'Fiqih',
            'kelas_id' => $kelas->id,
            'ustadz_id' => $ustadz->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/kepegawaian/{$ustadz->id}/jadwal");

        $response->assertOk()
            ->assertJsonCount(0, 'wali_kelas')
            ->assertJsonCount(1, 'mata_pelajaran')
            ->assertJsonPath('mata_pelajaran.0.mapel_id', $mapel->id)
            ->assertJsonPath('mata_pelajaran.0.nama_mapel', 'Fiqih')
            ->assertJsonPath('mata_pelajaran.0.nama_kelas', 'Kelas 8B');
    }

    public function test_ustadz_yang_merangkap_wali_kelas_dan_pengajar_mapel_muncul_di_keduanya(): void
    {
        $admin = User::factory()->admin()->create();
        $ustadz = User::factory()->ustadz()->create();
        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $kelasDiampu = Kelas::create([
            'nama' => 'Kelas 9C',
            'tingkat' => 'SMP',
            'wali_kelas_id' => $ustadz->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        $kelasLain = Kelas::create([
            'nama' => 'Kelas 9D',
            'tingkat' => 'SMP',
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        MataPelajaran::create([
            'nama' => 'Bahasa Arab',
            'kelas_id' => $kelasLain->id,
            'ustadz_id' => $ustadz->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/kepegawaian/{$ustadz->id}/jadwal");

        $response->assertOk()
            ->assertJsonCount(1, 'wali_kelas')
            ->assertJsonCount(1, 'mata_pelajaran')
            ->assertJsonPath('wali_kelas.0.kelas_id', $kelasDiampu->id)
            ->assertJsonPath('mata_pelajaran.0.nama_mapel', 'Bahasa Arab');
    }

    public function test_jadwal_kosong_jika_ustadz_belum_diampu_kelas_atau_mapel_apapun(): void
    {
        $admin = User::factory()->admin()->create();
        $ustadz = User::factory()->ustadz()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/kepegawaian/{$ustadz->id}/jadwal");

        $response->assertOk()
            ->assertJsonCount(0, 'wali_kelas')
            ->assertJsonCount(0, 'mata_pelajaran');
    }

    public function test_jadwal_ditolak_jika_user_bukan_ustadz(): void
    {
        $admin = User::factory()->admin()->create();
        $waliSantri = User::factory()->waliSantri()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/kepegawaian/{$waliSantri->id}/jadwal");

        $response->assertUnprocessable();
    }

    public function test_ustadz_tidak_bisa_akses_endpoint_jadwal_ustadz_lain(): void
    {
        $ustadzLogin = User::factory()->ustadz()->create();
        $ustadzTarget = User::factory()->ustadz()->create();

        $response = $this->actingAs($ustadzLogin, 'sanctum')
            ->getJson("/api/admin/kepegawaian/{$ustadzTarget->id}/jadwal");

        $response->assertForbidden();
    }
}
