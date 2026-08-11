# Spesifikasi Desain UI/UX — Sistem Manajemen Pesantren
**Untuk:** Web Admin & Panel Ustadz (Laravel) + Aplikasi Mobile Wali Santri (Flutter)
**Dokumen:** Panduan Tim Developer — UI/UX & Spesifikasi Teknis
**Versi:** 2.0 — direvisi mengikuti PRD v1.4 (10 Agustus 2026)

> **Perubahan utama dari v1.0:**
> - Aplikasi mobile **hanya untuk Wali Santri** (bukan Santri). Wali memantau anaknya, bukan login sebagai dirinya sendiri sebagai murid.
> - Website dipakai **dua role sekaligus**: Admin (kontrol penuh) dan Ustadz (kelas yang diampu + tugas tambahan jika ditunjuk).
> - Ditambahkan fitur dari PRD: Asrama/Kamar, Poin Pelanggaran, Data Kepegawaian Ustadz, Manajemen Penugasan (Penanggung Jawab Perizinan & Petugas Keuangan), QR Code Penjemputan, Rapor gabungan + ekspor PDF.
> - Referensi visual (dashboard admin, student portal, UNPIX Mobile) tetap hanya acuan gaya, bukan konten yang direplikasi.

---

## 1. Ringkasan Platform & Role

| Platform | Role | Deskripsi |
|---|---|---|
| **Website** (Laravel, session-based) | **Admin** | Kontrol penuh: user, santri, kelas, asrama, penugasan, keuangan, laporan |
| **Website** (Laravel, session-based) | **Ustadz** | Kelas yang diampu: absensi, nilai, hafalan, poin pelanggaran + tugas tambahan (Penanggung Jawab Perizinan dan/atau Petugas Keuangan) jika ditunjuk Admin |
| **Aplikasi Mobile** (Flutter, native) | **Wali Santri** | Memantau anak (bisa >1), ajukan izin, bayar SPP, lihat rapor & hafalan |

> Santri **tidak** punya akun/login sendiri di sistem versi ini — semua informasi santri diakses lewat akun Wali Santri di mobile, atau oleh Ustadz/Admin di website.

---

## 2. Palet Warna (Tema Biru) — tetap

| Token | Hex | Penggunaan |
|---|---|---|
| `primary-900` | `#0B2E6B` | Gradasi atas header/hero |
| `primary-700` | `#12408F` | Gradasi tengah, tombol primer hover |
| `primary-500` | `#1E5FD9` | Warna utama brand, tombol primer, ikon aktif |
| `primary-300` | `#5C8DF0` | Aksen sekunder, badge info |
| `primary-100` | `#E7EEFD` | Background kartu terang, chip |
| `accent-gold` | `#F2B705` | Aksen islami (hafalan/prestasi), dipakai terbatas |
| `success` | `#16A34A` | Lunas, hadir, disetujui |
| `warning` | `#F59E0B` | Menunggu verifikasi, izin, poin sedang |
| `danger` | `#DC2626` | Telat, alpa, ditolak, poin berat |
| `neutral-900` | `#111827` | Teks utama |
| `neutral-500` | `#6B7280` | Teks sekunder |
| `neutral-100` | `#F3F4F6` | Background halaman |
| `white` | `#FFFFFF` | Kartu, permukaan |

**Gradasi utama:** `linear-gradient(160deg, #0B2E6B 0%, #1E5FD9 60%, #5C8DF0 100%)`

---

## 3. Tipografi — tetap
- **Font:** Poppins (heading) / Inter (body)
- Skala: H1 28/32px · H2 22/26px · H3 18/24px · Body 14–16px · Caption 12px

---

## 4. Prinsip Desain
1. **Islami & bersih** — ruang kosong cukup, ikon rounded.
2. **Konsisten** — badge status, kartu, progress bar sama bentuknya di Web & Mobile.
3. **Wali Santri = ringkas** — data anak harus terlihat cepat: kartu ringkasan di Home (kehadiran hari ini, tagihan aktif, izin terakhir).
4. **Ustadz = fokus kelas** — begitu login, langsung lihat kelas yang diampu, bukan seluruh data pesantren.
5. **Admin = kontrol & laporan** — dashboard berat data (tabel, grafik, ekspor).
6. Radius 12–16px, shadow lembut `0 4px 12px rgba(11,46,107,0.08)`.

---

## 5. WEBSITE — Struktur Dua Role

### 5.1 Breakpoint
- Desktop ≥1200px (sidebar tetap terbuka) · Tablet 768–1199px (sidebar collapsible) · Mobile browser <768px (drawer, tabel → card-list)

### 5.2 Layout Umum (sama untuk Admin & Ustadz, konten sidebar beda)
```
┌──────────────┬─────────────────────────────────────────┐
│  Sidebar biru │  Topbar (nama role aktif, notifikasi,   │
│  (logo,menu)  │  profil, badge "Penanggung Jawab" jika  │
│               │  Ustadz punya tugas tambahan)            │
│               ├─────────────────────────────────────────┤
│               │  Kartu Statistik (sesuai role)           │
│               │  Konten utama (tabel/form/grafik)        │
└──────────────┴─────────────────────────────────────────┘
```
> **Indikator penugasan (baru):** jika Ustadz yang login ditunjuk sebagai Penanggung Jawab Perizinan dan/atau Petugas Keuangan, tampilkan **badge kecil di topbar** (mis. "🔑 Bendahara") dan menu tambahan otomatis muncul di sidebar — tidak perlu halaman terpisah untuk role campuran.

### 5.3 Sidebar Menu — Admin
- Dashboard
- Manajemen User (Admin/Ustadz/Wali Santri)
- Data Santri
- Data Kepegawaian Ustadz *(baru)*
- Kelas & Tahun Ajaran
- Asrama & Kamar *(baru)*
- Jenis Pelanggaran & Rekap Poin *(baru)*
- Keuangan → Jenis Tagihan, Monitoring Pembayaran, Laporan
- Perizinan (monitoring, read-only)
- Penjemputan (log QR) *(baru)*
- Manajemen Penugasan *(baru — tunjuk/cabut Penanggung Jawab Perizinan & Petugas Keuangan)*
- Pengumuman & Kegiatan
- Pengaturan Sistem

### 5.4 Sidebar Menu — Ustadz
- Dashboard (ringkasan kelas yang diampu)
- Kelas Saya → daftar santri per kelas
- Absensi
- Nilai & Catatan Perkembangan
- Hafalan (Tahfidz)
- Poin Pelanggaran *(baru)*
- Ajukan Pindah Kelas Santri
- Izin/Cuti Saya *(riwayat izin staf sendiri — baru)*
- *(muncul jika ditunjuk)* → Perizinan Santri (approve/reject)
- *(muncul jika ditunjuk)* → Keuangan → Buat Tagihan, Verifikasi Pembayaran

### 5.5 Halaman Kunci — Admin
| Halaman | Komponen |
|---|---|
| **Dashboard** | Kartu statistik (Total Santri, Kehadiran Hari Ini, Tagihan Belum Lunas, Izin Pending) + grafik donat (sebaran per kelas/asrama) + tabel aktivitas terbaru |
| **Data Santri** | Tabel + filter (kelas, asrama, status), tombol import Excel/CSV, aksi lihat/edit/nonaktifkan |
| **Data Kepegawaian** | Tabel Ustadz dengan biodata, jadwal mengajar (rekap otomatis), riwayat izin/cuti |
| **Asrama & Kamar** | Grid kartu per asrama → drill-down daftar kamar & okupansi, tombol pindah kamar (dengan histori) |
| **Poin Pelanggaran** | Tabel jenis pelanggaran (CRUD bobot poin) + tabel rekap total poin per santri, badge warna sesuai ambang batas |
| **Manajemen Penugasan** | List Ustadz dengan toggle "Penanggung Jawab Perizinan" & "Petugas Keuangan", bisa multi-ustadz aktif |
| **Keuangan** | Tabel tagihan & status (Lunas/Menunggu Verifikasi/Telat), badge warna, export laporan |
| **Penjemputan** | Log tabel: santri, kode QR, waktu digunakan, petugas yang scan |

### 5.6 Halaman Kunci — Ustadz
| Halaman | Komponen |
|---|---|
| **Dashboard** | Kartu ringkas (Jumlah Santri di Kelas, Kehadiran Hari Ini, Tugas Menunggu jika ada penugasan) |
| **Kelas Saya** | List santri kelas yang diampu, klik → profil ringkas (read-only biodata) |
| **Absensi** | Form input harian per santri, status warna (Hadir/Sakit/Izin/Alpa) |
| **Nilai & Catatan** | Form nilai per mapel per semester + textarea catatan perkembangan — otomatis tergabung jadi Rapor di app Wali |
| **Hafalan** | Form catat surah/ayat/status + riwayat per santri |
| **Poin Pelanggaran** | Pilih santri → pilih jenis pelanggaran (poin otomatis terisi) → simpan |
| **Perizinan Santri** *(khusus ditunjuk)* | List pengajuan masuk, tombol Setujui/Tolak + catatan |
| **Keuangan** *(khusus ditunjuk)* | Tombol "Buat Tagihan" (manual, pilih santri/kelas + jenis tagihan), tabel verifikasi bukti transfer masuk |

### 5.7 Komponen UI Reusable — Website
- Kartu statistik (ikon bulat + angka besar + label)
- Badge status (pill warna sesuai §2)
- Badge penugasan di topbar (khusus Ustadz dengan tugas tambahan)
- Tabel responsif → card-list di mobile browser
- Progress bar poin pelanggaran (hijau→kuning→merah sesuai ambang batas)
- Modal konfirmasi aksi

---

## 6. APLIKASI MOBILE (Flutter) — Khusus Wali Santri

> Native app. Splash & login bergradasi biru penuh (gaya referensi UNPIX Mobile). Wali Santri **tidak melihat data pesantren secara umum** — hanya data anak yang terhubung ke akunnya.

### 6.1 Alur Layar Awal
1. **Splash Screen** — logo pesantren di atas gradasi biru
2. **Login** — background gradasi biru, form kartu putih rounded, opsi biometrik
3. **Pemilihan Anak** *(baru — jika wali punya >1 santri)* — daftar kartu foto+nama anak, tap untuk masuk ke Home anak tsb; ada tombol "Ganti Anak" persisten di Home

### 6.2 Home Screen
- Header gradasi biru: foto anak yang aktif dipilih, nama & kelas, tombol ganti anak, ikon notifikasi
- **Kartu Ringkasan** (3 kartu horizontal-scroll atau grid 2 kolom): Kehadiran Bulan Ini (%), Status Tagihan (Lunas/Ada Tagihan), Total Poin Pelanggaran (dengan warna sesuai ambang batas)
- **Grid Menu Cepat:**
  - Kehadiran
  - Rapor & Nilai
  - Hafalan Qur'an
  - Asrama & Kamar *(baru)*
  - Poin Pelanggaran *(baru)*
  - Pembayaran SPP
  - Perizinan
  - Pengumuman
  - Kalender Kegiatan
- **Agenda Mendatang** — list card (tanggal, nama kegiatan, waktu, lokasi)
- **Bottom Navigation (4 tab):** Home · Keuangan · Perizinan · Lainnya

### 6.3 Layar Detail
| Layar | Isi |
|---|---|
| **Kehadiran** | Kalender bulanan warna per hari + persentase kehadiran |
| **Rapor & Nilai** | List nilai per mapel per semester + catatan perkembangan dari Ustadz dalam satu tampilan; tombol **"Unduh Rapor (PDF)"** |
| **Hafalan** | List progres per surah/juz + riwayat setoran & catatan ustadz |
| **Asrama & Kamar** *(baru)* | Info asrama, nomor kamar, nama pembina asrama |
| **Poin Pelanggaran** *(baru)* | Total poin (angka besar + indikator warna) + riwayat pelanggaran (tanggal, jenis, poin, dicatat oleh) |
| **Keuangan** | Kartu tagihan aktif (nominal, jatuh tempo), tombol "Upload Bukti Transfer", riwayat status (Menunggu Verifikasi/Lunas/Telat) |
| **Perizinan** | Form ajukan izin (jenis, tanggal, alasan, lampiran) + status pengajuan (Pending/Disetujui/Ditolak) |
| **Kode QR Penjemputan** *(baru)* | Muncul otomatis setelah izin disetujui — QR besar di tengah layar + masa berlaku (countdown), untuk ditunjukkan ke petugas gerbang |
| **Pengumuman** | List pengumuman dari pesantren, filter belum dibaca |
| **Kalender Kegiatan** | Kalender bulanan + list agenda |

### 6.4 Komponen Mobile Reusable
- Kartu ringkasan (angka besar + label + ikon, warna dinamis sesuai status)
- Kartu menu grid (ikon bulat pastel + label 2 baris)
- Kartu tagihan gaya saldo (gradasi biru, gaya referensi UNPIX)
- QR code display component (full-card, dengan timer masa berlaku)
- Badge notifikasi merah pada lonceng & bottom nav
- Bottom sheet aksi cepat (ajukan izin, upload bukti bayar)
- Selector "Ganti Anak" (avatar list horizontal di Home)

---

## 7. Ikonografi & Aset — tetap
- Ikon outline/rounded 24px grid
- Ilustrasi islami-modern (biru + putih/emas aksen) untuk splash, empty state
- Avatar default: inisial nama dalam lingkaran `primary-100`, teks `primary-700`

---

## 8. Ringkasan Perbedaan Platform & Role

| Aspek | Website — Admin | Website — Ustadz | Mobile — Wali Santri |
|---|---|---|---|
| Cakupan data | Seluruh pesantren | Kelas yang diampu (+ tugas tambahan jika ditunjuk) | Hanya anak sendiri |
| Navigasi | Sidebar kiri | Sidebar kiri (menu dinamis sesuai penugasan) | Bottom tab |
| Fokus | Kontrol, laporan, penugasan | Input data harian kelas | Pantau & aksi cepat pribadi |
| Layout data | Tabel & grafik | Form input & tabel kelas | Kartu & progress bar |

---

## 9. Catatan Implementasi untuk Developer
- Gunakan design token warna (§2) sebagai CSS variables (Laravel/Blade/Tailwind) dan Color constants (Flutter) — harus identik nilainya di kedua platform.
- Badge status (lunas, hadir, disetujui, dst.) memakai warna yang **sama persis** di Web & Mobile.
- Menu sidebar Ustadz bersifat **dinamis**: render menu Perizinan/Keuangan hanya jika `penugasan_ustadz.is_active = true` untuk user login — jangan hardcode berdasarkan role saja.
- Home screen mobile wajib mendukung **multi-anak**: state "anak aktif" disimpan di app (bukan server-side session terpisah), semua API call membawa `santri_id` yang sedang aktif.
- Komponen kartu ringkasan, progress bar, dan badge sebaiknya dibuat sebagai shared design tokens (Figma + JSON) agar tim Laravel & Flutter tidak drift secara visual.
- Layar Kode QR Penjemputan harus tetap bisa diakses **offline-view** (screenshot terakhir) untuk kondisi sinyal lemah di gerbang — tapi validasi tetap online di sisi petugas scan.