<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi ini mengizinkan frontend Next.js (domain terpisah dari
    | API Laravel ini) untuk melakukan request ke endpoint /api/*.
    | Tanpa ini, browser akan memblokir semua request dari Next.js ke API
    | karena kebijakan Same-Origin browser.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // PERBAIKAN: ganti dengan domain Next.js kamu yang sebenarnya.
    // Untuk development, localhost:3000 adalah default port Next.js.
    // Untuk production, ganti dengan domain asli (mis. "https://admin.pesantren.com").
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // PENTING: set true HANYA jika kamu pakai autentikasi berbasis cookie
    // (Sanctum SPA mode). Jika pakai Bearer token seperti mobile app
    // (direkomendasikan untuk Next.js — lihat penjelasan di bawah), set false.
    'supports_credentials' => false,

];