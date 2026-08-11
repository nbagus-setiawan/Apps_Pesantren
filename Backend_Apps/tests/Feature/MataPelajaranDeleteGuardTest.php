<?php

namespace Tests\Feature;

use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\Santri;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MataPelajaranDeleteGuardTest extends TestCase
{
    use RefreshDatabase;

    private function buatMapelDenganKelas(): array
    {
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

        return [$mapel, $kelas, $tahunAjaran, $ustadz];
    }

    public function test_admin_tidak_bisa_hapus_mapel_yang_masih_punya_riwayat_nilai(): void
    {
        $admin = User::factory()->admin()->create();
        [$mapel, $kelas, $tahunAjaran, $ustadz] = $this->buatMapelDenganKelas();

        $santri = Santri::create([
            'nis' => '2026900',
            'nama' => 'Santri Uji Nilai',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2012-01-01',
            'kelas_id' => $kelas->id,
            'tanggal_masuk' => '2026-07-01',
            'status' => 'aktif',
        ]);

        Nilai::create([
            'santri_id' => $santri->id,
            'mapel_id' => $mapel->id,
            'semester' => 1,
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nilai_angka' => 85,
            'created_by' => $ustadz->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/mata-pelajaran/{$mapel->id}");

        $response->assertUnprocessable();

        // Mapel dan riwayat nilainya harus tetap ada, tidak ikut terhapus.
        $this->assertDatabaseHas('mata_pelajaran', ['id' => $mapel->id]);
        $this->assertDatabaseHas('nilai', ['mapel_id' => $mapel->id]);
    }

    public function test_admin_bisa_hapus_mapel_yang_belum_punya_riwayat_nilai(): void
    {
        $admin = User::factory()->admin()->create();
        [$mapel] = $this->buatMapelDenganKelas();

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/mata-pelajaran/{$mapel->id}");

        $response->assertOk();

        $this->assertDatabaseMissing('mata_pelajaran', ['id' => $mapel->id]);
    }
}