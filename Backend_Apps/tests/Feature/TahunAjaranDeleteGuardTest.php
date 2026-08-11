<?php

namespace Tests\Feature;

use App\Models\Kelas;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TahunAjaranDeleteGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_tidak_bisa_hapus_tahun_ajaran_yang_masih_punya_kelas(): void
    {
        $admin = User::factory()->admin()->create();

        $tahunAjaran = TahunAjaran::create(['nama' => '2025/2026', 'is_active' => false]);

        Kelas::create([
            'nama' => 'Kelas 7A',
            'tingkat' => 'SMP',
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/tahun-ajaran/{$tahunAjaran->id}");

        $response->assertUnprocessable();

        // Tahun ajaran dan kelasnya harus tetap ada, tidak ikut terhapus.
        $this->assertDatabaseHas('tahun_ajaran', ['id' => $tahunAjaran->id]);
        $this->assertDatabaseHas('kelas', ['tahun_ajaran_id' => $tahunAjaran->id]);
    }

    public function test_admin_bisa_hapus_tahun_ajaran_yang_tidak_punya_kelas(): void
    {
        $admin = User::factory()->admin()->create();

        $tahunAjaran = TahunAjaran::create(['nama' => '2024/2025', 'is_active' => false]);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/tahun-ajaran/{$tahunAjaran->id}");

        $response->assertOk();

        $this->assertDatabaseMissing('tahun_ajaran', ['id' => $tahunAjaran->id]);
    }

    public function test_admin_tidak_bisa_hapus_tahun_ajaran_yang_sedang_aktif(): void
    {
        $admin = User::factory()->admin()->create();

        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/tahun-ajaran/{$tahunAjaran->id}");

        $response->assertUnprocessable();

        $this->assertDatabaseHas('tahun_ajaran', ['id' => $tahunAjaran->id]);
    }
}