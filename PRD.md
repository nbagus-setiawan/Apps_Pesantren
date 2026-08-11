# PRD (Product Requirements Document)
# Sistem Manajemen Pesantren — Web Admin & Mobile Wali Santri

**Versi:** 1.5
**Tanggal:** 12 Agustus 2026
**Status:** Draft (Fase 1 final, Fase 2 & 3 sudah mencakup fitur kualitas, bisnis, legal & operasional jangka panjang)

> **Perubahan dari v1.4:** Revisi arsitektur web Admin/Ustadz — dari asumsi Laravel session-based (Blade view) menjadi **Next.js sebagai SPA terpisah** yang konsumsi REST API Laravel yang sama dengan mobile app. Lihat Bagian 2 untuk detail lengkap.

---

## 1. Latar Belakang & Tujuan

Pesantren membutuhkan satu sistem terpadu yang menghubungkan tiga pihak: **Admin** (pengelola operasional), **Ustadz** (pengajar/wali kelas), dan **Wali Santri** (orang tua/wali). Saat ini proses seperti absensi, nilai, hafalan, perizinan, dan pembayaran SPP masih manual/tersebar, sehingga informasi lambat sampai ke wali santri.

**Tujuan produk:**
- Memusatkan data santri (akademik, kehadiran, hafalan, keuangan) dalam satu sistem.
- Memberi Wali Santri akses real-time ke perkembangan anaknya lewat aplikasi mobile.
- Mempermudah Ustadz mencatat aktivitas harian santri.
- Mempermudah Admin mengelola operasional pesantren dan keuangan.

**Di luar cakupan (out of scope) versi 1.0:**
- Fitur chat real-time antar user (dijadwalkan fase 2).
- Pembayaran online via payment gateway (fase 2 — versi 1 hanya upload bukti transfer manual).
- Aplikasi mobile untuk Ustadz (versi 1 Ustadz akses via Website).

---

## 2. Gambaran Arsitektur

| Komponen | Teknologi | Digunakan Oleh |
|---|---|---|
| Mobile App | Flutter | Wali Santri |
| Web Admin & Panel Ustadz | **Next.js (SPA, konsumsi REST API Laravel)** | Admin, Ustadz/Ustadzah |
| Backend API | Laravel 13 | Semua platform (Mobile & Web) |
| Database | MySQL | Semua (via Laravel API) |
| Autentikasi API | Laravel Sanctum (token-based) | Mobile & Web |

Baik Mobile App (Flutter) maupun Web Admin/Ustadz (Next.js) sama-sama **tidak** akses database langsung — keduanya konsumsi REST API Laravel yang sama (`/api/...`) memakai autentikasi token Sanctum (Bearer token), pola yang identik dengan yang dipakai mobile app. `routes/web.php` di backend Laravel ini murni untuk halaman placeholder/health-check, **bukan** untuk merender UI Admin/Ustadz.

> **Keputusan arsitektur (revisi v1.5):** Draft awal PRD (v1.4 dan sebelumnya) sempat mengasumsikan web Admin/Ustadz dibangun session-based langsung di Laravel (Blade view). Keputusan final: **web Admin/Ustadz dibangun sebagai aplikasi Next.js terpisah** yang berkomunikasi dengan backend Laravel murni lewat REST API — arsitektur yang sama seperti mobile app. Alasan: satu sumber API untuk semua platform, tidak ada duplikasi logic otorisasi antara Blade dan API, dan frontend web/mobile bisa dikembangkan paralel tanpa saling blocking.

### 2.1 Alur Autentikasi Next.js ↔ Laravel API

- Di Next.js: pakai flow `POST /api/login` → simpan token → kirim `Authorization: Bearer {token}` di setiap fetch ke endpoint `/api/admin/*` atau `/api/ustadz/*`.
- Tidak ada perubahan di backend untuk mendukung ini — semua controller, route, dan middleware yang sudah ada di Laravel **langsung jalan** dipakai Next.js, tanpa perlu guard `web`/session baru maupun Blade view.
- Token disimpan di sisi Next.js sebaiknya lewat `httpOnly` cookie yang di-set dari Next.js server-side (route handler / server action) — **bukan** `localStorage` — untuk mengurangi risiko pencurian token lewat XSS.
- Backend Laravel perlu mengizinkan origin Next.js lewat konfigurasi CORS (`config/cors.php`) agar browser tidak memblokir request lintas domain saat development (`localhost:3000`) maupun production (domain Next.js yang sebenarnya).
- Logout, refresh data user (`GET /api/me`), dan revoke token (`POST /api/logout`) memakai endpoint yang sama persis dengan yang dipakai mobile app — tidak ada endpoint terpisah untuk web.

---

## 3. Role & Hak Akses

| Role | Platform | Deskripsi Singkat |
|---|---|---|
| **Admin** | Website (Next.js) | Kontrol penuh sistem: data master, keuangan, user, pengumuman |
| **Ustadz** | Website (Next.js) | Mengajar 1+ kelas, mencatat absensi/nilai/hafalan santri di kelasnya |
| **Wali Santri** | Mobile App (Flutter) | Orang tua/wali, memantau 1+ anak (santri) miliknya |

> **Catatan penting:** Selain hak akses standar per role, Admin dapat **menunjuk Ustadz tertentu** untuk memegang dua tugas tambahan (bisa satu Ustadz merangkap, atau dibagi ke beberapa Ustadz berbeda):
> - **Penanggung Jawab Perizinan** — berlaku **untuk seluruh pesantren** (bukan per kelas/asrama). Biasanya 1-2 Ustadz yang ditunjuk menangani semua pengajuan izin dari seluruh santri.
> - **Petugas Keuangan / Bendahara** — satu-satunya yang berwenang membuat tagihan SPP secara manual dan memverifikasi bukti pembayaran.
>
> Penunjukan ini dilakukan Admin lewat menu **Manajemen Penugasan**, tidak hardcode di kode program, sehingga bisa diganti kapan saja tanpa ubah role dasar Ustadz.

---

## 4. Fitur per Role

### 4.1 Admin (Website)

**Manajemen User**
- CRUD akun Admin, Ustadz, Wali Santri
- Reset password, nonaktifkan akun
- Assign role

**Manajemen Kepegawaian Ustadz (Baru)**
- Lengkapi biodata Ustadz (NIP/NUPTK jika ada, alamat, no. HP, pendidikan terakhir, tanggal mulai mengajar)
- Lihat jadwal mengajar per Ustadz (rekap dari data kelas & mapel yang diampu)
- Riwayat izin/cuti Ustadz sendiri (terpisah dari perizinan santri)

**Manajemen Data Santri**
- CRUD data santri (biodata, foto, kelas, wali)
- Kaitkan santri dengan Wali Santri (1 santri bisa 1–2 wali; 1 wali bisa punya banyak santri)
- Import data santri massal (Excel/CSV)
- Status santri (aktif, alumni, keluar, cuti)

**Manajemen Asrama/Kamar (Baru)**
- CRUD data asrama & kamar (nama, kapasitas, pembina asrama)
- Assign santri ke kamar, pindah kamar (dengan histori)
- Lihat okupansi tiap kamar/asrama

**Manajemen Tata Tertib & Poin Pelanggaran (Baru)**
- CRUD jenis pelanggaran & bobot poin (mis. "Terlambat sholat berjamaah" = 5 poin)
- Lihat rekap poin pelanggaran seluruh santri
- Tetapkan ambang batas (mis. total poin > 100 = pemanggilan wali)

**Manajemen Akademik**
- CRUD kelas & tahun ajaran
- CRUD mata pelajaran, assign ke Ustadz
- Lihat rekap nilai & rapor seluruh santri

**Manajemen Kehadiran**
- Lihat rekap absensi seluruh santri/kelas
- Export laporan kehadiran

**Manajemen Penugasan (Baru)**
- Tunjuk Ustadz sebagai **Penanggung Jawab Perizinan** (berlaku untuk seluruh pesantren, bisa lebih dari satu ustadz sebagai cadangan)
- Tunjuk Ustadz sebagai **Petugas Keuangan/Bendahara** (bisa lebih dari satu)
- Cabut/ganti penugasan kapan saja

**Keuangan / SPP**
- Buat jenis tagihan (SPP bulanan, uang gedung, kegiatan, dll) — nominal & jenis diatur Admin
- *(Pembuatan tagihan bulanan aktual dilakukan manual oleh Petugas Keuangan yang ditunjuk — lihat 4.2)*
- Lihat seluruh riwayat & status pembayaran (lunas/belum/telat), termasuk yang diverifikasi Petugas Keuangan
- Laporan keuangan (harian/bulanan)

**Perizinan**
- Lihat rekap seluruh riwayat izin per santri (read-only, monitoring)
- *(Approve/reject dilakukan oleh Ustadz Penanggung Jawab Perizinan yang ditunjuk — lihat 4.2, bukan Admin langsung)*

**Pengumuman & Kegiatan**
- Buat pengumuman (broadcast ke semua / role tertentu / kelas tertentu)
- Kelola kalender kegiatan pesantren

**Laporan & Dashboard**
- Dashboard ringkasan: jumlah santri aktif, kehadiran hari ini, tagihan belum lunas, dsb
- Export laporan (PDF/Excel)

**Penjemputan (QR Code) (Baru)**
- Lihat log penjemputan santri (siapa, kapan, kode yang dipakai)
- Setting durasi berlaku kode QR

**Pengaturan Sistem**
- Setting umum aplikasi (nama pesantren, logo, tahun ajaran aktif)
- Manajemen backup data (opsional)

---

### 4.2 Ustadz (Website)

Fitur dasar berlaku untuk **semua** Ustadz. Dua sub-bagian di bawah (Perizinan & Keuangan) **hanya muncul** bagi Ustadz yang ditunjuk Admin sebagai Penanggung Jawab/Petugas terkait.

**Kelas & Santri**
- Lihat daftar santri di kelas yang diampu
- Lihat profil santri (read-only untuk data biodata)
- Ajukan pindah kelas santri (perlu approval Admin) — histori kelas lama tetap tersimpan

**Absensi**
- Input absensi harian per santri (Hadir/Sakit/Izin/Alpa)
- Edit absensi hari berjalan

**Nilai & Rapor**
- Input nilai per mata pelajaran, per santri, per semester
- Tulis catatan perkembangan santri (perilaku, prestasi, dll) per semester
- Nilai + catatan perkembangan otomatis tergabung sebagai **Rapor** yang tampil ke Wali Santri (lihat 4.3)

**Hafalan (Tahfidz)**
- Catat progress hafalan santri (surah, ayat, tanggal, status: lancar/mengulang)
- Lihat riwayat hafalan per santri

**Poin Pelanggaran (Baru)**
- Catat pelanggaran santri (pilih dari jenis yang ditetapkan Admin, poin otomatis terhitung)
- Lihat riwayat & total poin pelanggaran santri di kelasnya

**Notifikasi**
- Terima notifikasi dari Admin (pengumuman, jadwal)

---

**🔑 Khusus Ustadz yang ditunjuk sebagai Penanggung Jawab Perizinan:**
- Terima seluruh pengajuan izin santri yang masuk (tidak dibatasi kelas yang diampu, kecuali di-scope Admin)
- Approve/reject pengajuan izin lengkap dengan catatan

**🔑 Khusus Ustadz yang ditunjuk sebagai Petugas Keuangan/Bendahara:**
- Buat tagihan SPP secara **manual** tiap bulan per santri/kelas (bukan otomatis oleh sistem)
- Verifikasi bukti pembayaran yang diupload Wali Santri
- Tandai status tagihan (lunas/telat/menunggu verifikasi)
- Lihat laporan keuangan dasar

---

### 4.3 Wali Santri (Mobile App - Flutter)

**Profil & Santri**
- Login & kelola profil pribadi
- Lihat profil anak (bisa lebih dari 1 santri dalam satu akun)
- Switch antar anak jika wali punya lebih dari 1 santri

**Kehadiran**
- Lihat riwayat kehadiran anak (harian/bulanan)
- Notifikasi jika anak alpa/sakit/izin

**Akademik**
- Lihat **rapor** anak per semester (nilai per mapel + catatan perkembangan dari Ustadz digabung dalam satu tampilan)
- **Unduh rapor sebagai PDF** (Baru — tampilan sederhana, bukan format rapor formal cetak resmi)
- Lihat progress hafalan (tahfidz) anak

**Asrama & Kedisiplinan (Baru)**
- Lihat kamar/asrama tempat anak tinggal
- Lihat riwayat & total poin pelanggaran anak

**Keuangan**
- Lihat tagihan aktif & riwayat pembayaran
- Upload bukti transfer pembayaran
- Notifikasi jatuh tempo tagihan

**Perizinan & Penjemputan**
- Ajukan izin untuk anak (sakit, pulang, keperluan keluarga) lengkap tanggal & alasan
- Lihat status pengajuan izin (pending/disetujui/ditolak)
- **Dapatkan kode QR penjemputan (Baru)** setelah izin disetujui, ditunjukkan ke petugas gerbang saat menjemput

**Informasi**
- Lihat pengumuman dari pesantren
- Lihat kalender kegiatan pesantren
- Terima push notification (pengumuman, tagihan, absensi, catatan ustadz)

---

## 5. Struktur Database (MySQL)

### 5.1 Tabel Inti

**`users`**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| name | VARCHAR | |
| email | VARCHAR UNIQUE | |
| phone | VARCHAR | |
| password | VARCHAR | |
| role | ENUM('admin','ustadz','wali_santri') | |
| avatar | VARCHAR | nullable |
| is_active | BOOLEAN | default true |
| created_at / updated_at | TIMESTAMP | |

**`data_kepegawaian`** *(baru — 1:1 dengan users, hanya untuk role ustadz/admin)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| user_id | BIGINT FK → users.id UNIQUE | |
| nip_nuptk | VARCHAR | nullable |
| alamat | TEXT | nullable |
| pendidikan_terakhir | VARCHAR | nullable |
| tanggal_mulai_tugas | DATE | |
| status_kepegawaian | ENUM('tetap','honorer','magang') | |

**`izin_ustadz`** *(baru — cuti/izin staf, terpisah dari `perizinan` santri)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| ustadz_id | BIGINT FK → users.id | |
| jenis | ENUM('cuti','sakit','izin_lain') | |
| tanggal_mulai | DATE | |
| tanggal_selesai | DATE | |
| alasan | TEXT | |
| status | ENUM('pending','disetujui','ditolak') | |
| disetujui_oleh | BIGINT FK → users.id | role = admin |

**`santri`**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| nis | VARCHAR UNIQUE | Nomor Induk Santri |
| nama | VARCHAR | |
| jenis_kelamin | ENUM('L','P') | |
| tanggal_lahir | DATE | |
| alamat | TEXT | nullable |
| foto | VARCHAR | nullable |
| kelas_id | BIGINT FK → kelas.id | |
| kamar_id | BIGINT FK → kamar.id | nullable |
| status | ENUM('aktif','alumni','keluar','cuti') | |
| tanggal_masuk | DATE | |
| created_at / updated_at | TIMESTAMP | |

**`asrama`** *(baru)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| nama | VARCHAR | mis. "Asrama Putra 1" |
| pembina_id | BIGINT FK → users.id | role = ustadz, nullable |

**`kamar`** *(baru)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| asrama_id | BIGINT FK → asrama.id | |
| nama | VARCHAR | mis. "Kamar 3" |
| kapasitas | INT | |

**`riwayat_kamar`** *(baru — histori pindah kamar, pola sama seperti riwayat_kelas)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| santri_id | BIGINT FK → santri.id | |
| kamar_id | BIGINT FK → kamar.id | |
| tanggal_mulai | DATE | |
| tanggal_selesai | DATE | nullable — null berarti kamar saat ini |
| dipindahkan_oleh | BIGINT FK → users.id | admin |

**`wali_santri` (pivot user ↔ santri)**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| user_id | BIGINT FK → users.id | role = wali_santri |
| santri_id | BIGINT FK → santri.id | |
| hubungan | ENUM('ayah','ibu','wali') | |

> Satu wali bisa punya banyak santri, satu santri bisa punya lebih dari satu wali (ayah & ibu) → many-to-many.

**`kelas`**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| nama | VARCHAR | mis. "Kelas 7A" |
| tingkat | VARCHAR | mis. "SMP", "MTs" |
| wali_kelas_id | BIGINT FK → users.id | role = ustadz |
| tahun_ajaran_id | BIGINT FK → tahun_ajaran.id | |

**`tahun_ajaran`**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| nama | VARCHAR | mis. "2026/2027" |
| is_active | BOOLEAN | |

**`penugasan_ustadz`** *(baru — mekanisme "ustadz yang ditunjuk Admin")*
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| ustadz_id | BIGINT FK → users.id | role = ustadz |
| jenis_tugas | ENUM('perizinan','keuangan') | |
| ditunjuk_oleh | BIGINT FK → users.id | role = admin |
| is_active | BOOLEAN | default true, agar mudah cabut tanpa hapus histori |
| created_at | TIMESTAMP | |

> Satu Ustadz bisa punya lebih dari satu baris (mis. jadi Penanggung Jawab Perizinan **dan** Petugas Keuangan sekaligus). Query "siapa yang boleh approve izin" tinggal cek tabel ini, bukan hardcode role.

**`riwayat_kelas`** *(baru — untuk pindah kelas dengan histori)*
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| santri_id | BIGINT FK → santri.id | |
| kelas_id | BIGINT FK → kelas.id | |
| tahun_ajaran_id | BIGINT FK → tahun_ajaran.id | |
| tanggal_mulai | DATE | |
| tanggal_selesai | DATE | nullable — null berarti kelas saat ini |
| keterangan | VARCHAR | nullable, mis. "Naik kelas", "Pindah asrama" |
| dipindahkan_oleh | BIGINT FK → users.id | admin yang approve |

> `santri.kelas_id` selalu mencerminkan kelas **aktif saat ini** (sinkron dengan baris `riwayat_kelas` yang `tanggal_selesai IS NULL`). Saat pindah kelas: baris lama di-set `tanggal_selesai`, baris baru dibuat. Nilai & absensi tetap terhubung ke `kelas_id`/`tahun_ajaran_id` yang berlaku saat dicatat, jadi histori akademik tidak tertimpa.

### 5.2 Tabel Akademik

**`mata_pelajaran`**
| id, nama, kelas_id (FK), ustadz_id (FK → users.id) |

**`nilai`**
| id, santri_id (FK), mapel_id (FK), semester, tahun_ajaran_id (FK), nilai_angka, nilai_huruf, keterangan, created_by (FK ustadz) |

**`hafalan`**
| id, santri_id (FK), surah, ayat_mulai, ayat_selesai, tanggal, status ENUM('lancar','mengulang','belum'), catatan, dicatat_oleh (FK ustadz) |

### 5.3 Tabel Kehadiran

**`absensi`**
| id, santri_id (FK), tanggal, status ENUM('hadir','sakit','izin','alpa'), keterangan, dicatat_oleh (FK ustadz), created_at |

### 5.3b Tabel Poin Pelanggaran *(baru)*

**`jenis_pelanggaran`**
| id, nama (mis. "Terlambat sholat berjamaah"), poin (INT), kategori ENUM('ringan','sedang','berat') |

**`pelanggaran`**
| id, santri_id (FK), jenis_pelanggaran_id (FK), poin_saat_itu (INT, snapshot poin agar histori tidak berubah jika bobot diedit kemudian), tanggal, catatan, dicatat_oleh (FK ustadz), created_at |

> Total poin santri dihitung `SUM(poin_saat_itu)` dari tabel `pelanggaran`, bisa difilter per semester/tahun ajaran.

### 5.4 Tabel Keuangan

**`jenis_tagihan`**
| id, nama (mis. "SPP Bulanan"), nominal_default, tipe ENUM('bulanan','sekali','tahunan') |

**`tagihan`**
| id, santri_id (FK), jenis_tagihan_id (FK), periode (mis. "2026-09"), nominal, jatuh_tempo, status ENUM('belum_bayar','menunggu_verifikasi','lunas','telat'), dibuat_oleh (FK users → ustadz dengan `penugasan_ustadz.jenis_tugas = 'keuangan'`) |

**`pembayaran`**
| id, tagihan_id (FK), dibayar_oleh (FK users, wali), jumlah_bayar, bukti_transfer (file path), tanggal_bayar, status ENUM('pending','diverifikasi','ditolak'), diverifikasi_oleh (FK users → petugas keuangan), catatan_petugas |

### 5.5 Tabel Perizinan

**`perizinan`**
| id, santri_id (FK), diajukan_oleh (FK users, wali), jenis ENUM('sakit','izin_pulang','keperluan_lain'), tanggal_mulai, tanggal_selesai, alasan, status ENUM('pending','disetujui','ditolak'), diproses_oleh (FK users → ustadz dengan `penugasan_ustadz.jenis_tugas = 'perizinan'`), catatan, **kode_qr** (VARCHAR, unik, generate saat status = disetujui), **qr_berlaku_sampai** (TIMESTAMP), **qr_digunakan_at** (TIMESTAMP, nullable — diisi saat petugas gerbang scan) |

> Kolom `kode_qr` dkk (**baru**) mendukung fitur penjemputan: setelah izin disetujui, sistem generate kode unik dengan masa berlaku terbatas (setting Admin), ditampilkan sebagai QR di app Wali Santri, dan ditandai terpakai saat di-scan petugas.

### 5.6 Tabel Informasi & Notifikasi

**`pengumuman`**
| id, judul, isi, target_role ENUM('semua','admin','ustadz','wali_santri'), target_kelas_id (FK, nullable), dibuat_oleh (FK admin), created_at |

**`kegiatan`**
| id, judul, deskripsi, tanggal_mulai, tanggal_selesai, lokasi |

**`notifikasi`**
| id, user_id (FK), judul, isi, tipe (absensi/tagihan/pengumuman/perizinan/nilai), is_read, created_at |

**`catatan_perkembangan`**
| id, santri_id (FK), ustadz_id (FK), semester, tahun_ajaran_id (FK), isi, tanggal, created_at |

> `nilai` + `catatan_perkembangan` sama-sama terikat ke `santri_id` + `semester` + `tahun_ajaran_id`, sehingga endpoint **Rapor** (`GET /api/santri/{id}/rapor?semester=&tahun_ajaran_id=`) tinggal menggabungkan keduanya dalam satu response JSON tanpa perlu tabel `rapor` terpisah.

---

## 6. Ringkasan Endpoint API (contoh, akan detail di API Spec terpisah)

```
POST   /api/login
POST   /api/logout
GET    /api/me

# Wali Santri
GET    /api/santri                     -> daftar anak milik wali login
GET    /api/santri/{id}/absensi
GET    /api/santri/{id}/rapor          -> gabungan nilai + catatan perkembangan
GET    /api/santri/{id}/rapor/pdf      -> unduh versi PDF
GET    /api/santri/{id}/hafalan
GET    /api/santri/{id}/pelanggaran    -> riwayat & total poin
GET    /api/santri/{id}/kamar          -> info asrama/kamar
GET    /api/santri/{id}/tagihan
POST   /api/pembayaran                 -> upload bukti bayar
POST   /api/perizinan                  -> ajukan izin
GET    /api/perizinan/{id}/qr          -> ambil kode QR (setelah disetujui)
GET    /api/pengumuman
GET    /api/kegiatan

# Ustadz — fitur dasar (semua ustadz)
GET    /api/ustadz/kelas
GET    /api/ustadz/kelas/{id}/santri
POST   /api/ustadz/absensi
POST   /api/ustadz/nilai
POST   /api/ustadz/hafalan
POST   /api/ustadz/catatan-perkembangan
POST   /api/ustadz/pelanggaran         -> catat poin pelanggaran
POST   /api/ustadz/pindah-kelas        -> ajukan pindah kelas (perlu approval admin)

# Ustadz — khusus Penanggung Jawab Perizinan (dicek via tabel penugasan_ustadz)
GET    /api/ustadz/perizinan
PUT    /api/ustadz/perizinan/{id}      -> approve/reject

# Ustadz — khusus Petugas Keuangan (dicek via tabel penugasan_ustadz)
POST   /api/ustadz/tagihan             -> buat tagihan manual
PUT    /api/ustadz/pembayaran/{id}/verifikasi

# Petugas Gerbang (bisa Admin/Ustadz yang ditunjuk, scan QR)
POST   /api/penjemputan/scan           -> validasi & tandai kode QR terpakai

# Admin
CRUD   /api/admin/users
CRUD   /api/admin/santri
CRUD   /api/admin/kelas
CRUD   /api/admin/asrama
CRUD   /api/admin/kamar
CRUD   /api/admin/jenis-pelanggaran
CRUD   /api/admin/kepegawaian          -> data kepegawaian & izin ustadz
CRUD   /api/admin/penugasan-ustadz     -> tunjuk/cabut Penanggung Jawab Perizinan & Petugas Keuangan
PUT    /api/admin/pindah-kelas/{id}/approve
CRUD   /api/admin/pengumuman
GET    /api/admin/dashboard
```

---

## 7. Kebutuhan Non-Fungsional

- **Keamanan:** autentikasi token (Sanctum), role-based access control di tiap endpoint, hash password (bcrypt), validasi input di semua form.
- **Performa:** API response < 1 detik untuk operasi standar; pagination di semua list data.
- **Skalabilitas:** struktur database dirancang untuk banyak santri/kelas/tahun ajaran tanpa migrasi besar.
- **Audit trail:** kolom `created_by`/`diproses_oleh` di tabel penting untuk lacak siapa melakukan aksi.
- **Notifikasi:** push notification (Firebase Cloud Messaging) ke Wali Santri untuk kejadian penting (absensi alpa, tagihan baru, izin disetujui/ditolak, pengumuman).
- **Multi tahun ajaran:** data nilai/kelas terikat ke `tahun_ajaran` agar histori tidak tertimpa saat naik kelas.
- **Backup:** backup database berkala (harian, disimpan minimal 30 hari).
- **Privasi data:** enforce hak akses di level query API (bukan hanya UI) — satu akun Wali Santri hanya bisa query data santri yang terkait dengannya; dicek di setiap endpoint, bukan diasumsikan dari tampilan.
- **CORS:** backend Laravel mengizinkan origin frontend Next.js secara eksplisit lewat `config/cors.php` (bukan wildcard `*`), agar hanya domain Next.js yang sah yang bisa memanggil API dari browser.

---

## 8. Fase Pengembangan (Roadmap)

**Fase 1 — MVP**
- Auth & manajemen user (3 role) + Manajemen Penugasan (Penanggung Jawab Perizinan & Petugas Keuangan)
- Data santri, kelas, tahun ajaran, **asrama & kamar**
- **Data kepegawaian Ustadz** (biodata, jadwal mengajar, izin/cuti staf)
- Absensi, nilai, hafalan, **poin pelanggaran** (Ustadz)
- Pindah kelas dengan approval Admin & histori
- Rapor gabungan (nilai + catatan perkembangan) + **ekspor PDF**
- Lihat data anak, ajukan izin, **QR code penjemputan** (Wali Santri via mobile)
- Tagihan manual oleh Petugas Keuangan + upload bukti bayar
- Pengumuman & notifikasi dasar
- **Web Admin & Ustadz dibangun sebagai aplikasi Next.js**, terhubung ke backend API Laravel yang sama dengan mobile

**Fase 2 — Pengembangan Lanjutan**
- Payment gateway (Midtrans/Xendit) untuk pembayaran online
- Chat/komunikasi Ustadz ↔ Wali Santri
- Aplikasi mobile untuk Ustadz
- Notifikasi WhatsApp (broadcast) sebagai kanal cadangan push notification
- Target hafalan jangka panjang dengan progress bar
- Eskalasi otomatis perizinan jika Penanggung Jawab tidak merespons
- Rapor formal PDF sesuai format resmi pesantren (versi Fase 1 masih sederhana)
- Laporan analitik lebih dalam (grafik kehadiran, nilai, poin pelanggaran per periode)
- **Dashboard analitik interaktif** (grafik bisa difilter tanggal, drill-down data)
- **Notification Center in-app** (riwayat notifikasi tersimpan, bukan cuma sekilas)
- **Role & Permission granular** (hak akses per-fitur, bukan cuma 3 role kaku — pakai Spatie Laravel Permission)
- **Global search** di web admin (cari santri/tagihan/nilai dari satu kotak pencarian)
- **Audit log lengkap** (siapa ubah apa & kapan, di semua modul)
- **2FA (Two-Factor Authentication)** untuk akun Admin & Petugas Keuangan

**Fase 3 — Jangka Panjang (opsional)**
- Tabungan/Uang Saku Santri
- PPDB Online (pendaftaran santri baru)
- Perpustakaan, Ekstrakurikuler & Prestasi
- Dokumentasi API (Swagger/OpenAPI), automated testing, backup terjadwal formal

---

## 9. Legal, Kematangan Operasional & Sentuhan Khas Pesantren

Bagian ini bukan requirement teknis (tidak menambah tabel database baru), tapi catatan penting agar sistem terasa matang dan sesuai konteks pesantren saat diimplementasikan.

### 9.1 Legal & Privasi Data
- **Kebijakan privasi & persetujuan wali** — karena sistem menyimpan data anak di bawah umur, perlu pernyataan tertulis (bisa di halaman/dokumen terpisah) soal siapa yang boleh akses data santri dan berapa lama data disimpan setelah santri lulus/keluar (mengacu UU PDP).
- **Isolasi data antar wali** — sudah ditegaskan di kebutuhan non-fungsional (bagian 7): akses dicek di level API, bukan cuma disembunyikan di tampilan.

### 9.2 Sentuhan Khas Pesantren
- **Kalender Hijriah** berdampingan dengan Masehi di kalender kegiatan (`kegiatan`) — banyak agenda pesantren mengacu penanggalan Hijriah.
- **Jadwal sholat otomatis** di dashboard/app, mengikuti lokasi pesantren (bisa integrasi API pihak ketiga seperti Kemenag/Aladhan).
- **Donasi/Infaq Online** (opsional, arahnya ke Fase 3) — kalau pesantren menerima donasi dari wali/masyarakat umum, bisa dikembangkan modul transparansi laporan donasi terpisah dari SPP.

### 9.3 Keandalan Sistem (Reliability)
- **Error tracking** (mis. Sentry) — supaya bug di production terdeteksi tim sebelum jadi komplain dari wali santri.
- **Staging environment** — tempat uji fitur baru sebelum tayang ke server produksi.
- **Rencana disaster recovery** — bukan cuma backup rutin, tapi juga prosedur pemulihan yang pernah diuji: kalau server down, berapa lama pulih dan sampai titik data mana yang aman.

### 9.4 Dokumentasi & Onboarding
- **Buku panduan pengguna** terpisah untuk Admin, Ustadz, dan Wali Santri — penting karena sebagian wali santri mungkin kurang familiar dengan aplikasi.
- **FAQ/Help in-app** — halaman bantuan sederhana di dalam aplikasi untuk mengurangi beban tanya-jawab manual ke Admin.

> Rekomendasi penempatan: 9.1 (legal & privasi) sebaiknya sudah dipikirkan sejak **Fase 1** meski implementasinya ringan (cukup halaman kebijakan + enforcement akses di API). 9.2–9.4 cocok menyusul di **Fase 2–3** bersamaan dengan fitur kualitas teknis lainnya.

---

## 10. Keputusan yang Sudah Dikonfirmasi

| Topik | Keputusan |
|---|---|
| Arsitektur Web Admin/Ustadz | **Next.js sebagai SPA terpisah**, konsumsi REST API Laravel yang sama dengan mobile app lewat token Sanctum (Bearer token) — bukan Blade/session-based (revisi dari draft v1.4 dan sebelumnya) |
| Approval izin santri | Ustadz yang **ditunjuk Admin** (Penanggung Jawab Perizinan), berlaku **untuk seluruh pesantren** (1-2 ustadz), bukan per kelas/asrama |
| Pembuatan tagihan SPP | **Manual**, dibuat oleh Ustadz yang **ditunjuk Admin** (Petugas Keuangan/Bendahara) — bukan auto-generate sistem |
| Pindah kelas di tengah tahun ajaran | **Didukung di Fase 1**, butuh **approval Admin**, histori kelas lama tersimpan via tabel `riwayat_kelas` |
| Format rapor Fase 1 | **Nilai per mapel + catatan perkembangan Ustadz** digabung dalam satu tampilan/endpoint, plus **ekspor PDF sederhana** |
| Fitur tambahan Fase 1 | **Sistem Poin Pelanggaran**, **Data Asrama/Kamar**, **QR Code Penjemputan**, **Ekspor Rapor PDF**, **Data Kepegawaian Ustadz** — semua sudah masuk struktur database & roadmap di atas |
| Kualitas teknis (dashboard analitik, notification center, role granular, audit log, 2FA, global search) | Masuk **Fase 2**, menyusul setelah MVP jalan stabil |
| Fitur bisnis lanjutan (tabungan santri, PPDB online, perpustakaan, ekstrakurikuler) | Masuk **Fase 3**, jangka panjang |
| Legal, kematangan operasional & sentuhan khas pesantren | Ditambahkan sebagai **section 9** (catatan, bukan tabel database) — privasi data disarankan sejak Fase 1, sisanya menyusul Fase 2–3 |

Tidak ada lagi pertanyaan terbuka untuk versi 1.5 ini. Dokumen sudah siap dipakai sebagai acuan untuk tahap desain ERD/migrasi Laravel dan pengembangan frontend Next.js.

---

*Dokumen ini adalah draft awal dan dapat direvisi sesuai kebutuhan spesifik pesantren.*