<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DataKepegawaianRoleGuardTest extends TestCase
{
    use RefreshDatabase;

    private function payloadValid(): array
    {
        return [
            'nip_nuptk' => '1234567890',
            'alamat' => 'Jl. Contoh No. 1',
            'pendidikan_terakhir' => 'S1',
            'tanggal_mulai_tugas' => '2026-07-01',
            'status_kepegawaian' => 'tetap',
        ];
    }

    public function test_admin_bisa_buat_data_kepegawaian_untuk_ustadz(): void
    {
        $admin = User::factory()->admin()->create();
        $ustadz = User::factory()->ustadz()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/kepegawaian/{$ustadz->id}", $this->payloadValid());

        $response->assertOk();
        $this->assertDatabaseHas('data_kepegawaian', [
            'user_id' => $ustadz->id,
            'nip_nuptk' => '1234567890',
        ]);
    }

    public function test_admin_bisa_buat_data_kepegawaian_untuk_sesama_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $adminLain = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/kepegawaian/{$adminLain->id}", $this->payloadValid());

        $response->assertOk();
    }

    /**
     * Kasus utama yang diperbaiki: sebelumnya endpoint ini tidak mengecek
     * role user target sama sekali, sehingga Admin bisa "salah pasang"
     * data kepegawaian ke akun wali_santri.
     */
    public function test_admin_tidak_bisa_buat_data_kepegawaian_untuk_wali_santri(): void
    {
        $admin = User::factory()->admin()->create();
        $wali = User::factory()->waliSantri()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/kepegawaian/{$wali->id}", $this->payloadValid());

        $response->assertUnprocessable();
        $this->assertDatabaseMissing('data_kepegawaian', ['user_id' => $wali->id]);
    }

    public function test_update_data_kepegawaian_yang_sudah_ada_tetap_berfungsi(): void
    {
        $admin = User::factory()->admin()->create();
        $ustadz = User::factory()->ustadz()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/kepegawaian/{$ustadz->id}", $this->payloadValid())
            ->assertOk();

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/kepegawaian/{$ustadz->id}", [
                ...$this->payloadValid(),
                'status_kepegawaian' => 'honorer',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('data_kepegawaian', [
            'user_id' => $ustadz->id,
            'status_kepegawaian' => 'honorer',
        ]);
        // Pastikan tidak membuat baris duplikat (updateOrCreate bekerja benar).
        $this->assertDatabaseCount('data_kepegawaian', 1);
    }

    public function test_ustadz_tidak_bisa_akses_endpoint_ini_sama_sekali(): void
    {
        $ustadzLogin = User::factory()->ustadz()->create();
        $ustadzTarget = User::factory()->ustadz()->create();

        $response = $this->actingAs($ustadzLogin, 'sanctum')
            ->putJson("/api/admin/kepegawaian/{$ustadzTarget->id}", $this->payloadValid());

        $response->assertForbidden();
    }
}