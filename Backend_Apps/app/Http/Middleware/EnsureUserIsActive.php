<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * PERBAIKAN KEAMANAN: AuthController::login hanya mengecek is_active saat
 * login. Setelah token Sanctum terbit, token tersebut tetap valid sampai
 * kedaluwarsa/dicabut manual meskipun Admin menonaktifkan akun user di
 * tengah sesi (mis. staf yang di-nonaktifkan, atau akun yang disusupi).
 *
 * Middleware ini menutup celah tersebut: setiap request terautentikasi
 * dicek ulang is_active-nya. Jika user sudah nonaktif, token langsung
 * dicabut (revoke) dan request ditolak dengan 401 — bukan hanya 403 —
 * supaya client tahu harus login ulang, bukan sekadar "tidak berwenang".
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_active) {
            // Cabut token yang sedang dipakai agar tidak bisa dipakai lagi
            // untuk request berikutnya, bukan hanya ditolak request ini saja.
            if (method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            abort(401, 'Akun Anda telah dinonaktifkan. Silakan hubungi Admin.');
        }

        return $next($request);
    }
}