# Sistem Manajemen Pesantren — Backend (Laravel 13)

Skeleton backend Laravel yang sudah distrukturkan mengikuti PRD (v1.4): 3 role
(Admin, Ustadz, Wali Santri), 26 tabel database, model + relasi Eloquent, dan
API resource per role dengan proteksi middleware.

## Struktur folder

```
app/
  Http/
    Controllers/
      Api/
        AuthController.php        # login/logout via Sanctum token
        Admin/                    # endpoint khusus role admin
        Ustadz/                   # endpoint khusus role ustadz
        WaliSantri/                # endpoint khusus role wali santri
      Web/Admin, Web/Ustadz       # (disiapkan) jika nanti butuh panel web selain API
    Middleware/
      CheckRole.php               # middleware `role:admin|ustadz|wali_santri`
    Requests/                     # (disiapkan) untuk FormRequest per modul
  Models/                         # 25 model + User, lengkap relasi
database/
  migrations/                     # 26 tabel sesuai ERD di PRD, urut berdasarkan FK
  seeders/DatabaseSeeder.php      # akun contoh tiap role + data awal
routes/
  api.php                         # seluruh endpoint API, dikelompokkan per role
  web.php                         # default (belum dipakai, API-first)
```

## Keputusan desain penting (mengikuti PRD)

- **Auth**: Laravel Sanctum (token-based), cocok untuk konsumsi dari app Flutter.
- **Role**: kolom `role` enum di tabel `users` (bukan tabel roles terpisah) —
  sesuai PRD yang hanya punya 3 role tetap.
- **Penunjukan Ustadz** sebagai Penanggung Jawab Perizinan / Petugas Keuangan:
  tabel `penugasan_ustadz`, dicek lewat `$user->punyaTugasAktif('perizinan')`
  atau `'keuangan'` di controller terkait — bukan role permanen, jadi bisa
  dicabut/diganti admin kapan saja.
- **Riwayat kelas & kamar**: tidak menimpa data lama. Pindah kelas/kamar akan
  menutup baris riwayat lama (`tanggal_selesai`) dan membuka baris baru,
  supaya histori akademik & asrama tetap utuh.
- **Poin pelanggaran** disimpan sebagai *snapshot* (`poin_saat_itu`) di tabel
  `pelanggaran`, agar histori tidak berubah jika bobot poin diedit di
  kemudian hari.
- **Perizinan pulang + QR**: saat izin disetujui, sistem generate `kode_qr`
  UUID yang berlaku 24 jam, dipindai satpam/ustadz lewat endpoint
  `POST /ustadz/perizinan/scan-qr`.
- **Pembayaran**: wali upload bukti transfer → status tagihan jadi
  `menunggu_verifikasi` → Petugas Keuangan verifikasi → tagihan `lunas`.

## Menjalankan proyek

> ⚠️ Composer install **belum** dijalankan di sandbox ini karena tidak ada
> akses jaringan ke packagist.org. Jalankan langkah berikut di komputer Anda:

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite   # default pakai SQLite, atau ubah .env ke MySQL
php artisan migrate --seed
php artisan serve
```

Akun contoh setelah seeding (password semua: `password`):

| Role         | Email                   |
|--------------|-------------------------|
| Admin        | admin@pesantren.test    |
| Ustadz       | ustadz@pesantren.test   |
| Wali Santri  | wali@pesantren.test     |

Login: `POST /api/login` dengan `email` + `password` → dapat `token`, dipakai
sebagai `Authorization: Bearer {token}` di setiap request selanjutnya.

## Yang sudah dibuat

- Seluruh migration 26 tabel sesuai ERD PRD, dengan foreign key & urutan yang benar.
- Seluruh model + relasi Eloquent.
- Middleware `role:` untuk proteksi endpoint per role.
- **CRUD lengkap** untuk semua modul referensi & inti: users, santri, kelas,
  asrama, kamar, tahun ajaran, mata pelajaran, jenis pelanggaran, jenis
  tagihan, kegiatan, pengumuman, data kepegawaian, relasi wali↔santri.
- Alur kerja utama tiap role: absensi, nilai, hafalan, pelanggaran (dengan
  snapshot poin), catatan perkembangan, izin ustadz, penugasan dinamis
  (Petugas Keuangan / Penanggung Jawab Perizinan), tagihan + verifikasi
  pembayaran, perizinan + QR penjemputan.
- **Observer notifikasi otomatis** (`app/Observers`): wali dapat notifikasi
  saat tagihan terbit/lunas, perizinan disetujui/ditolak, santri alpa, dan
  ada pengumuman baru (menghormati `target_role` & `target_kelas_id`).
- **Scheduler**: `php artisan tagihan:generate-bulanan` — generate tagihan
  bulanan (mis. SPP) untuk seluruh santri aktif, dijadwalkan otomatis tiap
  tanggal 1 lewat `routes/console.php` (`Schedule::command(...)`).
- **API Resource** (`app/Http/Resources`) untuk response JSON yang konsisten
  — contoh diterapkan di `SantriResource`, `TagihanResource`, `UserResource`.
- **FormRequest** terpisah (`app/Http/Requests`) — contoh pola di
  `StoreSantriRequest`, tinggal diduplikasi untuk modul lain sesuai kebutuhan.
- **Test otomatis** (PHPUnit, `tests/Feature`): login, proteksi role per
  endpoint, wali hanya bisa lihat anak sendiri, serta alur generate &
  validasi QR perizinan.
- `UserFactory` dengan state `admin()`, `ustadz()`, `waliSantri()` untuk
  mempermudah penulisan test lanjutan.

## Menjalankan test

```bash
php artisan test
```

## Langkah selanjutnya (di luar scope backend inti)

- Push notification (FCM) — saat ini notifikasi hanya tersimpan di tabel
  `notifikasi`; tinggal hubungkan ke layanan push saat observer membuat baris.
- Storage/CDN untuk file (foto santri, bukti transfer, avatar) — saat ini
  pakai local disk Laravel (`storage/app/public`), sesuaikan ke S3/GCS bila
  perlu untuk produksi.
- Rate limiting & audit log kalau dibutuhkan untuk compliance.
- Setup Flutter app yang mengonsumsi API ini (Fase 2–3 di roadmap PRD).
