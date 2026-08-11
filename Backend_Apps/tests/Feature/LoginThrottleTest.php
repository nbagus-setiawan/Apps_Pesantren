<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class LoginThrottleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Pastikan setiap test mulai dari kondisi limiter bersih, supaya
        // test ini tidak saling memengaruhi jika dijalankan dalam satu
        // proses/rangkaian dengan test lain yang juga memukul /api/login.
        RateLimiter::clear('5,1|'.request()->ip());
    }

    public function test_percobaan_login_gagal_dalam_batas_wajar_tidak_diblokir(): void
    {
        $user = User::factory()->admin()->create(['password' => 'rahasia123']);

        for ($i = 0; $i < 4; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'salah',
            ]);

            // Masih 422 (validasi kredensial), bukan 429 (throttled).
            $response->assertUnprocessable();
        }
    }

    public function test_percobaan_login_berlebihan_diblokir_throttle(): void
    {
        $user = User::factory()->admin()->create(['password' => 'rahasia123']);

        // 5 percobaan pertama (limit) — boleh gagal validasi seperti biasa.
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'salah',
            ]);
        }

        // Percobaan ke-6 dalam window yang sama harus kena throttle (429).
        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'salah',
        ]);

        $response->assertStatus(429);
    }

    public function test_login_berhasil_tidak_ikut_menghabiskan_kuota_secara_aneh(): void
    {
        $user = User::factory()->admin()->create(['password' => 'rahasia123']);

        // Login benar sekali, harus tetap sukses walau sudah pernah gagal
        // beberapa kali sebelumnya (selama belum melewati limit).
        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'salah',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'rahasia123',
        ]);

        $response->assertOk()->assertJsonStructure(['user', 'token']);
    }
}