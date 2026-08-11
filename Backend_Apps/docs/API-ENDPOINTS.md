# Daftar Endpoint API

Semua endpoint (kecuali `/login`) butuh header:
`Authorization: Bearer {token}`

## Auth
| Method | Path | Deskripsi |
|---|---|---|
| POST | /api/login | Login, dapat token |
| POST | /api/logout | Logout (revoke token) |
| GET  | /api/me | Data user yang sedang login |

## Rapor (lintas role — wali hanya anak sendiri, ustadz/admin bebas)
| Method | Path | Deskripsi |
|---|---|---|
| GET | /api/santri/{id}/rapor | Rapor gabungan (nilai + catatan perkembangan) |
| GET | /api/santri/{id}/rapor/pdf | Unduh rapor sebagai PDF sederhana |

Query opsional: `?semester=1&tahun_ajaran_id=1` (default: tahun ajaran aktif, semua semester).

## Admin (`/api/admin/...`)
| Method | Path | Deskripsi |
|---|---|---|
| GET | /dashboard | Ringkasan: santri aktif, kehadiran hari ini, tagihan belum lunas, perizinan pending |
| GET/POST | /users | List / buat user |
| GET/PUT/DELETE | /users/{id} | Detail / update / nonaktifkan |
| GET/POST | /santri | List / tambah santri |
| GET/PUT/DELETE | /santri/{id} | Detail / update / keluarkan santri |
| POST | /santri/{id}/pindah-kelas | Pindah kelas (histori otomatis) |
| POST | /santri/{id}/wali | Hubungkan wali ke santri |
| DELETE | /santri/{id}/wali/{userId} | Lepas wali dari santri |
| GET/POST/PUT/DELETE | /kelas, /kelas/{id} | CRUD kelas |
| GET/POST/PUT/DELETE | /asrama, /asrama/{id} | CRUD asrama |
| GET/POST/DELETE | /kamar, /kamar/{id} | CRUD kamar (tanpa show/update) |
| POST | /kamar/{id}/pindahkan-santri | Pindah kamar (histori otomatis) |
| GET/POST/PUT/DELETE | /tahun-ajaran | CRUD tahun ajaran |
| GET/POST/PUT/DELETE | /mata-pelajaran | CRUD mapel |
| GET/POST/PUT/DELETE | /jenis-pelanggaran | CRUD jenis pelanggaran |
| GET/POST/PUT/DELETE | /jenis-tagihan | CRUD **jenis** tagihan (master data, bukan tagihan aktual) |
| GET/POST/PUT/DELETE | /kegiatan | CRUD kegiatan |
| GET/PUT | /kepegawaian/{userId} | Lihat / update data kepegawaian ustadz |
| GET | /tagihan | List semua tagihan (**read-only monitoring** — lihat catatan di bawah) |
| GET/POST/DELETE | /pengumuman | CRUD pengumuman (tanpa show/update) |
| GET/POST | /penugasan-ustadz | List / tunjuk ustadz (perizinan/keuangan) |
| POST | /penugasan-ustadz/{id}/cabut | Cabut penugasan |
| GET | /izin-ustadz | List pengajuan izin ustadz |
| POST | /izin-ustadz/{id}/proses | Setujui/tolak izin ustadz |

> **Catatan (PRD §10):** Admin **tidak** membuat tagihan aktual. Endpoint
> `POST /admin/tagihan/generate-massal` yang lama sudah **dihapus** karena
> bertentangan dengan keputusan PRD ("pembuatan tagihan bulanan aktual
> dilakukan manual oleh Petugas Keuangan yang ditunjuk"). Lihat bagian
> Ustadz di bawah.

## Ustadz (`/api/ustadz/...`)
| Method | Path | Deskripsi |
|---|---|---|
| GET | /kelas | Daftar kelas yang diampu (wali kelas atau pengajar mapel di kelas itu) |
| GET | /kelas/{id}/santri | Daftar santri di kelas yang diampu |
| POST | /absensi/bulk | Input absensi harian (bulk per kelas) |
| GET | /absensi | Lihat absensi |
| GET/POST/PUT | /nilai | Input & lihat nilai |
| GET/POST | /hafalan | Catat & lihat hafalan |
| GET/POST | /pelanggaran | Catat & lihat pelanggaran |
| GET/POST | /catatan-perkembangan | Catat & lihat catatan perkembangan |
| GET/POST | /izin | Ajukan & lihat izin/cuti pribadi |
| GET | /perizinan | List pengajuan izin santri (khusus PJ Perizinan) |
| POST | /perizinan/{id}/proses | Setujui/tolak izin santri → generate QR |
| POST | /perizinan/scan-qr | Verifikasi QR saat penjemputan |
| GET | /pembayaran | List pembayaran pending (khusus Petugas Keuangan) |
| POST | /pembayaran/{id}/verifikasi | Verifikasi/tolak bukti transfer |
| GET | /tagihan | List tagihan (khusus Petugas Keuangan) |
| POST | /tagihan | **Buat tagihan manual** untuk satu santri (khusus Petugas Keuangan) |
| POST | /tagihan/generate-bulanan | **Buat tagihan manual** untuk banyak santri sekaligus — mis. SPP bulanan seluruh kelas/seluruh santri aktif. Tetap dipicu manual oleh Petugas Keuangan lewat request ini, **bukan** dijadwalkan otomatis oleh sistem (khusus Petugas Keuangan) |

## Wali Santri (`/api/wali/...`)
| Method | Path | Deskripsi |
|---|---|---|
| GET | /anak | List anak milik wali yang login |
| GET | /anak/{santriId} | Detail lengkap 1 anak (nilai, absensi, dll) |
| GET | /tagihan | List tagihan anak |
| POST | /tagihan/{id}/bayar | Upload bukti transfer |
| GET/POST | /perizinan | Lihat & ajukan izin santri |
| GET | /perizinan/{id}/qr | Ambil kode QR (jika sudah disetujui) |
| GET | /notifikasi | List notifikasi |
| POST | /notifikasi/{id}/baca | Tandai sudah dibaca |
