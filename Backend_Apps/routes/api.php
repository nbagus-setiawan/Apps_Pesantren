<?php

use App\Http\Controllers\Api\Admin\AsramaController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\DataKepegawaianController;
use App\Http\Controllers\Api\Admin\IzinUstadzController;
use App\Http\Controllers\Api\Admin\JenisPelanggaranController;
use App\Http\Controllers\Api\Admin\JenisTagihanController;
use App\Http\Controllers\Api\Admin\KamarController;
use App\Http\Controllers\Api\Admin\KegiatanController;
use App\Http\Controllers\Api\Admin\KelasController as AdminKelasController;
use App\Http\Controllers\Api\Admin\LaporanController;
use App\Http\Controllers\Api\Admin\MataPelajaranController;
use App\Http\Controllers\Api\Admin\PelanggaranRekapController;
use App\Http\Controllers\Api\Admin\PengajuanPindahKelasController as AdminPengajuanPindahKelasController;
use App\Http\Controllers\Api\Admin\PengaturanController;
use App\Http\Controllers\Api\Admin\PengumumanController as AdminPengumumanController;
use App\Http\Controllers\Api\Admin\PenjemputanController;
use App\Http\Controllers\Api\Admin\PenugasanUstadzController;
use App\Http\Controllers\Api\Admin\PerizinanController;
use App\Http\Controllers\Api\Admin\SantriController;
use App\Http\Controllers\Api\Admin\TagihanController as AdminTagihanController;
use App\Http\Controllers\Api\Admin\TahunAjaranController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\WaliSantriController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RaporController;
use App\Http\Controllers\Api\Ustadz\AbsensiController;
use App\Http\Controllers\Api\Ustadz\CatatanPerkembanganController;
use App\Http\Controllers\Api\Ustadz\HafalanController;
use App\Http\Controllers\Api\Ustadz\IzinController;
use App\Http\Controllers\Api\Ustadz\KelasController as UstadzKelasController;
use App\Http\Controllers\Api\Ustadz\NilaiController;
use App\Http\Controllers\Api\Ustadz\PelanggaranController;
use App\Http\Controllers\Api\Ustadz\PembayaranController;
use App\Http\Controllers\Api\Ustadz\PengajuanPindahKelasController as UstadzPengajuanPindahKelasController;
use App\Http\Controllers\Api\Ustadz\PerizinanController as UstadzPerizinanController;
use App\Http\Controllers\Api\Ustadz\TagihanController as UstadzTagihanController;
use App\Http\Controllers\Api\WaliSantri\AnakController;
use App\Http\Controllers\Api\WaliSantri\NotifikasiController;
use App\Http\Controllers\Api\WaliSantri\PerizinanController as WaliPerizinanController;
use App\Http\Controllers\Api\WaliSantri\TagihanController as WaliTagihanController;
use Illuminate\Support\Facades\Route;

// ── Publik ────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

// ── Terautentikasi (semua role) ─────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Rapor: lintas role (wali hanya anak sendiri, ustadz/admin bebas),
    // otorisasi dicek di dalam RaporController, bukan lewat middleware role.
    Route::get('santri/{santriId}/rapor', [RaporController::class, 'index']);
    Route::get('santri/{santriId}/rapor/pdf', [RaporController::class, 'pdf']);

    // ── ADMIN ────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::apiResource('users', UserController::class);
        Route::apiResource('users', UserController::class);
        Route::put('users/{user}/reset-password', [UserController::class, 'resetPassword']); // ← tambahan baru
        Route::apiResource('santri', SantriController::class);
        Route::post('santri/import', [SantriController::class, 'import']);
        Route::post('santri/{santri}/pindah-kelas', [SantriController::class, 'pindahKelas']);
        Route::apiResource('kelas', AdminKelasController::class);
        Route::apiResource('asrama', AsramaController::class);
        Route::apiResource('kamar', KamarController::class)->except(['show', 'update']);
        Route::post('kamar/{kamar}/pindahkan-santri', [KamarController::class, 'pindahkanSantri']);

        Route::post('santri/{santri}/wali', [WaliSantriController::class, 'store']);
        Route::delete('santri/{santri}/wali/{userId}', [WaliSantriController::class, 'destroy']);

        Route::apiResource('tahun-ajaran', TahunAjaranController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('mata-pelajaran', MataPelajaranController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('jenis-pelanggaran', JenisPelanggaranController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('jenis-tagihan', JenisTagihanController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('kegiatan', KegiatanController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::get('kepegawaian/{user}', [DataKepegawaianController::class, 'show']);
        Route::put('kepegawaian/{user}', [DataKepegawaianController::class, 'update']);
        Route::get('kepegawaian/{user}/jadwal', [DataKepegawaianController::class, 'jadwal']);

        // Read-only monitoring — pembuatan tagihan dipindah ke Ustadz Petugas
        // Keuangan (lihat grup 'ustadz' di bawah), sesuai PRD §10.
        Route::get('tagihan', [AdminTagihanController::class, 'index']);

        // BARU: monitoring read-only riwayat perizinan santri (PRD §4.1).
        // Approve/reject tetap di Ustadz Penanggung Jawab Perizinan.
        Route::get('perizinan', [PerizinanController::class, 'index']);

        Route::apiResource('pengumuman', AdminPengumumanController::class)->only(['index', 'store', 'destroy']);
        Route::post('penugasan-ustadz', [PenugasanUstadzController::class, 'store']);
        Route::get('penugasan-ustadz', [PenugasanUstadzController::class, 'index']);
        Route::post('penugasan-ustadz/{penugasan}/cabut', [PenugasanUstadzController::class, 'cabut']);
        Route::get('izin-ustadz', [IzinUstadzController::class, 'index']);
        Route::post('izin-ustadz/{izinUstadz}/proses', [IzinUstadzController::class, 'proses']);

        // Pengajuan pindah kelas (approval alur, diajukan oleh Ustadz)
        Route::get('pengajuan-pindah-kelas', [AdminPengajuanPindahKelasController::class, 'index']);
        Route::post('pengajuan-pindah-kelas/{pengajuan}/proses', [AdminPengajuanPindahKelasController::class, 'proses']);

        // Pengaturan sistem (key-value): ambang batas poin, durasi QR, dll
        Route::get('pengaturan', [PengaturanController::class, 'index']);
        Route::put('pengaturan', [PengaturanController::class, 'update']);

        // Rekap poin pelanggaran + ambang batas
        Route::get('pelanggaran/rekap', [PelanggaranRekapController::class, 'index']);

        // Log penjemputan (QR)
        Route::get('penjemputan', [PenjemputanController::class, 'index']);

        // Laporan (CSV & PDF)
        Route::get('laporan/absensi', [LaporanController::class, 'absensi']);
        Route::get('laporan/keuangan', [LaporanController::class, 'keuangan']);
    });

    // ── USTADZ ───────────────────────────────────────────────
    Route::middleware('role:ustadz')->prefix('ustadz')->group(function () {
        Route::get('kelas', [UstadzKelasController::class, 'index']);
        Route::get('kelas/{kelas}/santri', [UstadzKelasController::class, 'santri']);

        Route::post('absensi/bulk', [AbsensiController::class, 'storeBulk']);
        Route::get('absensi', [AbsensiController::class, 'index']);

        Route::apiResource('nilai', NilaiController::class)->only(['index', 'store', 'update']);
        Route::apiResource('hafalan', HafalanController::class)->only(['index', 'store']);
        Route::apiResource('pelanggaran', PelanggaranController::class)->only(['index', 'store']);
        Route::apiResource('catatan-perkembangan', CatatanPerkembanganController::class)->only(['index', 'store']);

        Route::apiResource('izin', IzinController::class)->only(['index', 'store']);

        // Ajukan pindah kelas santri (butuh approval Admin)
        Route::post('pengajuan-pindah-kelas', [UstadzPengajuanPindahKelasController::class, 'store']);
        Route::get('pengajuan-pindah-kelas', [UstadzPengajuanPindahKelasController::class, 'index']);

        // hanya aktif jika ustadz punya penugasan aktif terkait (dicek di controller)
        Route::get('perizinan', [UstadzPerizinanController::class, 'index']);
        Route::post('perizinan/{perizinan}/proses', [UstadzPerizinanController::class, 'proses']);
        Route::post('perizinan/scan-qr', [UstadzPerizinanController::class, 'scanQr']);

        Route::get('pembayaran', [PembayaranController::class, 'index']);
        Route::post('pembayaran/{pembayaran}/verifikasi', [PembayaranController::class, 'verifikasi']);

        // Petugas Keuangan saja (dicek di controller via punyaTugasAktif('keuangan'))
        Route::get('tagihan', [UstadzTagihanController::class, 'index']);
        Route::post('tagihan', [UstadzTagihanController::class, 'store']);
        Route::post('tagihan/generate-bulanan', [UstadzTagihanController::class, 'generateBulanan']);
    });

    // ── WALI SANTRI ──────────────────────────────────────────
    Route::middleware('role:wali_santri')->prefix('wali')->group(function () {
        Route::get('anak', [AnakController::class, 'index']);
        Route::get('anak/{santriId}', [AnakController::class, 'show']);

        Route::get('tagihan', [WaliTagihanController::class, 'index']);
        Route::post('tagihan/{tagihan}/bayar', [WaliTagihanController::class, 'bayar']);

        Route::get('perizinan', [WaliPerizinanController::class, 'index']);
        Route::post('perizinan', [WaliPerizinanController::class, 'store']);
        Route::get('perizinan/{perizinan}/qr', [WaliPerizinanController::class, 'qr']);

        Route::get('notifikasi', [NotifikasiController::class, 'index']);
        Route::post('notifikasi/{id}/baca', [NotifikasiController::class, 'tandaiDibaca']);
    });
});