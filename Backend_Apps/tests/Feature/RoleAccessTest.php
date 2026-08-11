<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_bisa_akses_endpoint_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/santri');

        $response->assertOk();
    }

    public function test_ustadz_ditolak_akses_endpoint_admin(): void
    {
        $ustadz = User::factory()->ustadz()->create();

        $response = $this->actingAs($ustadz, 'sanctum')->getJson('/api/admin/santri');

        $response->assertForbidden();
    }

    public function test_wali_santri_ditolak_akses_endpoint_ustadz(): void
    {
        $wali = User::factory()->waliSantri()->create();

        $response = $this->actingAs($wali, 'sanctum')->getJson('/api/ustadz/absensi');

        $response->assertForbidden();
    }

    public function test_wali_santri_hanya_melihat_anaknya_sendiri(): void
    {
        $wali = User::factory()->waliSantri()->create();

        $response = $this->actingAs($wali, 'sanctum')->getJson('/api/wali/anak');

        $response->assertOk()->assertJsonCount(0);
    }
}
