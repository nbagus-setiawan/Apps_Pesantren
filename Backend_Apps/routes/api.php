<?php

use App\Http\Controllers\Api\Admin\AsramaController;
use App\Http\Controllers\Api\Admin\DataKepegawaianController;
use App\Http\Controllers\Api\Admin\IzinUstadzController;
use App\Http\Controllers\Api\Admin\JenisPelanggaranController;
use App\Http\Controllers\Api\Admin\JenisTagihanController;
use App\Http\Controllers\Api\Admin\KamarController;
use App\Http\Controllers\Api\Admin\KegiatanController;
use App\Http\Controllers\Api\Admin\KelasController;
use App\Http\Controllers\Api\Admin\MataPelajaranController;
use App\Http\Controllers\Api\Admin\PengumumanController as AdminPengumumanController;
use App\Http\Controllers\Api\Admin\PenugasanUstadzController;
use App\Http\Controllers\Api\Admin\SantriController;
use App\Http\Controllers\Api\Admin\TagihanController as AdminTagihanController;
use App\Http\Controllers\Api\Admin\TahunAjaranController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\WaliSantriController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Ustadz\AbsensiController;
use App\Http\Controllers\Api\Ustadz\CatatanPerkembanganController;
use App\Http\Controllers\Api\Ustadz\HafalanController;
use App\Http\Controllers\Api\Ustadz\IzinController;
use App\Http\Controllers\Api\Ustadz\NilaiController;
use App\Http\Controllers\Api\Ustadz\PelanggaranController;
use App\Http\Controllers\Api\Ustadz\PembayaranController;
use App\Http\Controllers\Api\Ustadz\PerizinanController as UstadzPerizinanController;
use App\Http\Controllers\Api\WaliSantri\AnakController;
use App\Http\Controllers\Api\WaliSantri\NotifikasiController;
use App\Http\Controllers\Api\WaliSantri\PerizinanController as WaliPerizinanController;
use App\Http\Controllers\Api\WaliSantri\TagihanController as WaliTagihanController;
use Illuminate\Support\Facades\Route;

// ── Publik ────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ── Terautentikasi (semua role) ─────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ── ADMIN ────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::apiResource('santri', SantriController::class);
        Route::post('santri/{santri}/pindah-kelas', [SantriController::class, 'pindahKelas']);
        Route::apiResource('kelas', KelasController::class);
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

        Route::get('tagihan', [AdminTagihanController::class, 'index']);
        Route::post('tagihan/generate-massal', [AdminTagihanController::class, 'generateMassal']);
        Route::apiResource('pengumuman', AdminPengumumanController::class)->only(['index', 'store', 'destroy']);
        Route::post('penugasan-ustadz', [PenugasanUstadzController::class, 'store']);
        Route::get('penugasan-ustadz', [PenugasanUstadzController::class, 'index']);
        Route::post('penugasan-ustadz/{penugasan}/cabut', [PenugasanUstadzController::class, 'cabut']);
        Route::get('izin-ustadz', [IzinUstadzController::class, 'index']);
        Route::post('izin-ustadz/{izinUstadz}/proses', [IzinUstadzController::class, 'proses']);
    });

    // ── USTADZ ───────────────────────────────────────────────
    Route::middleware('role:ustadz')->prefix('ustadz')->group(function () {
        Route::post('absensi/bulk', [AbsensiController::class, 'storeBulk']);
        Route::get('absensi', [AbsensiController::class, 'index']);

        Route::apiResource('nilai', NilaiController::class)->only(['index', 'store', 'update']);
        Route::apiResource('hafalan', HafalanController::class)->only(['index', 'store']);
        Route::apiResource('pelanggaran', PelanggaranController::class)->only(['index', 'store']);
        Route::apiResource('catatan-perkembangan', CatatanPerkembanganController::class)->only(['index', 'store']);

        Route::apiResource('izin', IzinController::class)->only(['index', 'store']);

        // hanya aktif jika ustadz punya penugasan aktif terkait (dicek di controller)
        Route::get('perizinan', [UstadzPerizinanController::class, 'index']);
        Route::post('perizinan/{perizinan}/proses', [UstadzPerizinanController::class, 'proses']);
        Route::post('perizinan/scan-qr', [UstadzPerizinanController::class, 'scanQr']);

        Route::get('pembayaran', [PembayaranController::class, 'index']);
        Route::post('pembayaran/{pembayaran}/verifikasi', [PembayaranController::class, 'verifikasi']);
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
