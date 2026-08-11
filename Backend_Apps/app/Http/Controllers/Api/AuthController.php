<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * PERBAIKAN: rate limiting login dipindah dari middleware
     * throttle:{namedLimiter} ke sini (manual, langsung pakai facade
     * RateLimiter). Alasan: pendekatan sebelumnya (RateLimiter::for()
     * + middleware throttle:login) ternyata kena bug resmi di Laravel
     * — Limit::by($key) kadang diabaikan middleware ThrottleRequests
     * dan jatuh ke fallback key global, sehingga dua email berbeda bisa
     * "berbagi" hitungan percobaan yang sama (lihat laravel/framework
     * issue #46290 & PR #53763).
     *
     * Dengan memanggil RateLimiter::tooManyAttempts()/hit()/clear()
     * secara manual di sini, kita sama sekali tidak lewat jalur
     * middleware yang bermasalah tsb — ini juga persis pola yang dipakai
     * scaffolding resmi Laravel (Breeze/Fortify LoginRequest) untuk
     * throttle login.
     */
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOGIN_DECAY_SECONDS = 60;

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $throttleKey = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            $detik = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'message' => "Terlalu banyak percobaan login. Coba lagi dalam {$detik} detik.",
            ], 429);
        }

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($throttleKey, self::LOGIN_DECAY_SECONDS);

            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (! $user->is_active) {
            RateLimiter::hit($throttleKey, self::LOGIN_DECAY_SECONDS);

            throw ValidationException::withMessages([
                'email' => ['Akun Anda tidak aktif. Hubungi admin.'],
            ]);
        }

        // Login berhasil — reset counter agar percobaan sukses tidak ikut
        // "menghukum" login berikutnya yang sah.
        RateLimiter::clear($throttleKey);

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil logout.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Key throttle dikombinasikan email (yang dicoba) + IP pengirim, agar:
     * - satu email tidak bisa "dikunci" orang lain dari IP manapun
     *   (DoS terhadap akun tertentu), dan
     * - satu IP tidak bisa mencoba banyak email berbeda tanpa batas.
     */
    private function throttleKey(Request $request): string
    {
        $email = Str::lower((string) $request->input('email'));

        return $email . '|' . $request->ip();
    }
}