<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class EnsureUserIsActiveTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_aktif_bisa_akses_endpoint_terautentikasi(): void
    {
        $admin = User::factory()->admin()->create(['is_active' => true]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/me');

        $response->assertOk();
    }

    /**
     * Skenario inti: token diterbitkan saat user masih aktif, lalu Admin
     * menonaktifkan user tersebut DI TENGAH SESI (tanpa user logout).
     * Request berikutnya dengan token lama harus ditolak, bukan tetap
     * diterima sampai token kedaluwarsa sendiri.
     *
     * CATATAN TEKNIS: Laravel tidak reboot aplikasi antar pemanggilan HTTP
     * dalam satu method test yang sama, sehingga guard 'sanctum' meng-cache
     * user yang sudah ter-resolve pada request pertama. Ini murni artefak
     * testing (di request HTTP sungguhan, setiap request memang selalu
     * fresh). Auth::forgetGuards() dipanggil di antara dua request untuk
     * mensimulasikan kondisi nyata: setiap request harus resolve ulang.
     */
    public function test_user_yang_dinonaktifkan_di_tengah_sesi_langsung_ditolak(): void
    {
        $ustadz = User::factory()->ustadz()->create(['is_active' => true]);
        $token = $ustadz->createToken('mobile')->plainTextToken;

        // Pastikan token masih berfungsi selagi user aktif.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertOk();

        // Lupakan guard yang sudah di-resolve, mensimulasikan request HTTP
        // baru yang sungguhan (bukan reuse objek dalam proses yang sama).
        Auth::forgetGuards();

        // Admin menonaktifkan user ini (tanpa proses logout dari sisi user).
        $ustadz->update(['is_active' => false]);

        // Request berikutnya dengan token yang SAMA harus ditolak 401.
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me');

        $response->assertUnauthorized();
    }

    public function test_token_otomatis_dicabut_setelah_user_dinonaktifkan(): void
    {
        $ustadz = User::factory()->ustadz()->create(['is_active' => true]);
        $token = $ustadz->createToken('mobile')->plainTextToken;

        $ustadz->update(['is_active' => false]);

        // Request pertama setelah nonaktif memicu revoke token oleh middleware.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertUnauthorized();

        // Token yang sama dipakai lagi — harus tetap gagal karena sudah
        // dihapus dari personal_access_tokens, bukan cuma "kebetulan" gagal
        // karena is_active masih false.
        $this->assertDatabaseCount('personal_access_tokens', 0);

        Auth::forgetGuards();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me');

        $response->assertUnauthorized();
    }

    public function test_route_publik_login_tetap_bisa_diakses_tanpa_token(): void
    {
        $user = User::factory()->admin()->create(['password' => 'rahasia123']);

        // Memastikan middleware EnsureUserIsActive yang dipasang global di
        // grup 'api' tidak ikut memblokir route publik /login (karena belum
        // ada user yang login pada request ini).
        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'rahasia123',
        ]);

        $response->assertOk();
    }
}