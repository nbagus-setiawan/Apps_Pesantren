<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_dengan_kredensial_benar(): void
    {
        $user = User::factory()->admin()->create(['password' => bcrypt('rahasia123')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'rahasia123',
        ]);

        $response->assertOk()->assertJsonStructure(['user', 'token']);
    }

    public function test_login_ditolak_jika_password_salah(): void
    {
        $user = User::factory()->admin()->create(['password' => bcrypt('rahasia123')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'salah',
        ]);

        $response->assertUnprocessable();
    }

    public function test_login_ditolak_untuk_user_nonaktif(): void
    {
        $user = User::factory()->admin()->create([
            'password' => bcrypt('rahasia123'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'rahasia123',
        ]);

        $response->assertUnprocessable();
    }

    public function test_me_membutuhkan_token(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }
}
