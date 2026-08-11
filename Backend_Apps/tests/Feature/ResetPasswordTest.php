<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_bisa_reset_password_user_lain(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->ustadz()->create(['password' => 'password_lama']);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/reset-password", [
                'password' => 'password_baru123',
                'password_confirmation' => 'password_baru123',
            ]);

        $response->assertOk();

        // Password lama tidak lagi bisa dipakai login, password baru bisa.
        $this->postJson('/api/login', [
            'email' => $target->email,
            'password' => 'password_lama',
        ])->assertUnprocessable();

        $this->postJson('/api/login', [
            'email' => $target->email,
            'password' => 'password_baru123',
        ])->assertOk();
    }

    public function test_reset_password_mencabut_semua_token_lama_milik_user(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->ustadz()->create();

        $target->createToken('token-lama-1');
        $target->createToken('token-lama-2');

        $this->assertSame(2, $target->tokens()->count());

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/reset-password", [
                'password' => 'password_baru123',
                'password_confirmation' => 'password_baru123',
            ])
            ->assertOk();

        $this->assertSame(0, $target->tokens()->count());
    }

    public function test_reset_password_gagal_jika_konfirmasi_tidak_cocok(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->ustadz()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/reset-password", [
                'password' => 'password_baru123',
                'password_confirmation' => 'tidak_cocok',
            ]);

        $response->assertUnprocessable();
    }

    public function test_reset_password_gagal_jika_password_kurang_dari_8_karakter(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->ustadz()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/reset-password", [
                'password' => 'pendek',
                'password_confirmation' => 'pendek',
            ]);

        $response->assertUnprocessable();
    }

    public function test_ustadz_tidak_bisa_akses_endpoint_reset_password(): void
    {
        $ustadz = User::factory()->ustadz()->create();
        $target = User::factory()->waliSantri()->create();

        $response = $this->actingAs($ustadz, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}/reset-password", [
                'password' => 'password_baru123',
                'password_confirmation' => 'password_baru123',
            ]);

        $response->assertForbidden();
    }
}