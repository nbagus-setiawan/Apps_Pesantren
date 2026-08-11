<?php

namespace Tests\Feature;

use App\Models\Santri;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WaliSantriRoleGuardTest extends TestCase
{
    use RefreshDatabase;

    private function buatSantri(string $nis = '2026900'): Santri
    {
        return Santri::create([
            'nis' => $nis,
            'nama' => 'Santri Uji Wali',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2012-01-01',
            'tanggal_masuk' => '2026-07-01',
            'status' => 'aktif',
        ]);
    }

    public function test_admin_bisa_hubungkan_akun_wali_santri_yang_valid(): void
    {
        $admin = User::factory()->admin()->create();
        $wali = User::factory()->waliSantri()->create(['is_active' => true]);
        $santri = $this->buatSantri();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/santri/{$santri->id}/wali", [
                'user_id' => $wali->id,
                'hubungan' => 'ayah',
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('wali_santri', [
            'user_id' => $wali->id,
            'santri_id' => $santri->id,
            'hubungan' => 'ayah',
        ]);
    }

    /**
     * Kasus utama yang diperbaiki: sebelumnya rule hanya 'exists:users,id'
     * tanpa memastikan role-nya wali_santri, sehingga Admin/Ustadz bisa
     * "terpasang" sebagai wali dari seorang santri.
     */
    public function test_admin_tidak_bisa_hubungkan_akun_admin_sebagai_wali(): void
    {
        $admin = User::factory()->admin()->create();
        $adminLain = User::factory()->admin()->create();
        $santri = $this->buatSantri('2026901');

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/santri/{$santri->id}/wali", [
                'user_id' => $adminLain->id,
                'hubungan' => 'wali',
            ]);

        $response->assertUnprocessable();
        $this->assertDatabaseMissing('wali_santri', ['user_id' => $adminLain->id]);
    }

    public function test_admin_tidak_bisa_hubungkan_akun_ustadz_sebagai_wali(): void
    {
        $admin = User::factory()->admin()->create();
        $ustadz = User::factory()->ustadz()->create();
        $santri = $this->buatSantri('2026902');

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/santri/{$santri->id}/wali", [
                'user_id' => $ustadz->id,
                'hubungan' => 'wali',
            ]);

        $response->assertUnprocessable();
        $this->assertDatabaseMissing('wali_santri', ['user_id' => $ustadz->id]);
    }

    public function test_admin_tidak_bisa_hubungkan_akun_wali_yang_nonaktif(): void
    {
        $admin = User::factory()->admin()->create();
        $waliNonaktif = User::factory()->waliSantri()->create(['is_active' => false]);
        $santri = $this->buatSantri('2026903');

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/santri/{$santri->id}/wali", [
                'user_id' => $waliNonaktif->id,
                'hubungan' => 'ibu',
            ]);

        $response->assertUnprocessable();
        $this->assertDatabaseMissing('wali_santri', ['user_id' => $waliNonaktif->id]);
    }

    public function test_satu_santri_bisa_punya_lebih_dari_satu_wali(): void
    {
        $admin = User::factory()->admin()->create();
        $ayah = User::factory()->waliSantri()->create();
        $ibu = User::factory()->waliSantri()->create();
        $santri = $this->buatSantri('2026904');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/santri/{$santri->id}/wali", [
                'user_id' => $ayah->id,
                'hubungan' => 'ayah',
            ])->assertCreated();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/santri/{$santri->id}/wali", [
                'user_id' => $ibu->id,
                'hubungan' => 'ibu',
            ])->assertCreated();

        $this->assertSame(2, $santri->wali()->count());
    }

    public function test_destroy_melepas_wali_dari_santri(): void
    {
        $admin = User::factory()->admin()->create();
        $wali = User::factory()->waliSantri()->create();
        $santri = $this->buatSantri('2026905');

        $santri->wali()->attach($wali->id, ['hubungan' => 'ayah']);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/santri/{$santri->id}/wali/{$wali->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('wali_santri', [
            'user_id' => $wali->id,
            'santri_id' => $santri->id,
        ]);
    }
}