# Sistem Manajemen Pesantren — Web Admin & Panel Ustadz (Next.js)

Frontend Next.js (App Router) untuk Admin & Ustadz, mengonsumsi REST API
Laravel yang sama dengan mobile app (lihat `PRD.md` §2 dan `DESAIGN.md` §1.1
di root repo backend). Tahap ini mencakup **setup project, autentikasi,
layout dasar, dan routing** — modul-modul CRUD (Data Santri, Keuangan, dst.)
masih berupa halaman placeholder yang siap diisi.

## Menjalankan secara lokal

```bash
cp .env.local.example .env.local
# lalu isi NEXT_PUBLIC_API_URL dengan URL backend Laravel Anda
npm install
npm run dev
```

Buka http://localhost:3000 — akun contoh dari `DatabaseSeeder`:

| Role   | Email                   | Password |
|--------|--------------------------|----------|
| Admin  | admin@pesantren.test      | password |
| Ustadz | ustadz@pesantren.test     | password |

Akun `wali_santri` sengaja ditolak login di web ini (lihat catatan di bawah).

## Keputusan arsitektur penting

1. **Token Sanctum tidak pernah ada di JavaScript sisi klien.**
   `POST /api/auth/login` (route handler Next.js, bukan langsung ke Laravel)
   menerima email/password dari form, memanggil `POST {API}/api/login`, lalu
   menyimpan token yang dikembalikan sebagai **cookie httpOnly**
   (`lib/session.ts`). Ini sesuai keputusan di PRD §2.1: *"Token disimpan di
   sisi Next.js sebaiknya lewat httpOnly cookie ... bukan localStorage."*

2. **Semua panggilan API dari komponen klien lewat proxy.**
   Karena cookie httpOnly tidak bisa dibaca JavaScript, komponen klien tidak
   bisa menyisipkan header `Authorization` sendiri. Sebagai gantinya, semua
   fetch data dari komponen klien memakai `apiFetch()` (`lib/api-client.ts`)
   yang memanggil `/api/proxy/{path}` — route handler catch-all
   (`app/api/proxy/[...path]/route.ts`) yang membaca cookie di server,
   menyisipkan `Authorization: Bearer {token}`, lalu meneruskan request ke
   Laravel. Response (termasuk file biner seperti PDF/CSV dari
   `LaporanController`/`RaporController`) diteruskan apa adanya.

3. **Middleware hanya mengecek keberadaan cookie**, bukan validitas/role,
   karena token Sanctum adalah string opaque (lihat `middleware.ts`).
   Validasi role sesungguhnya (Admin vs Ustadz) terjadi di `RoleGate`
   (`components/RoleGate.tsx`) lewat `GET /api/auth/me` → `useAuth()`, dan
   token yang sudah dicabut backend (mis. `EnsureUserIsActive`) otomatis
   membersihkan cookie lewat penanganan 401 di `app/api/auth/me/route.ts`
   dan `app/api/proxy/[...path]/route.ts`.

4. **Wali Santri ditolak di web.** Sesuai PRD §2 & §4.3, Wali Santri hanya
   punya akses lewat aplikasi mobile Flutter — kalau akun `wali_santri`
   berhasil autentikasi lewat `/api/login`, halaman login tetap menolak dan
   menampilkan pesan arahan ke aplikasi mobile (lihat `app/login/page.tsx`).

5. **Menu Ustadz dinamis** berdasarkan penugasan aktif (Penanggung Jawab
   Perizinan / Petugas Keuangan). Backend belum punya endpoint eksplisit
   "penugasan saya", jadi `lib/use-penugasan.ts` melakukan probe ringan ke
   endpoint yang sudah di-guard `punyaTugasAktif()` di backend (lihat
   catatan di file tersebut) — hanya untuk kebutuhan render menu, otorisasi
   sesungguhnya tetap di backend.

## Struktur folder

```
app/
  api/auth/{login,logout,me}/route.ts   # BFF auth endpoints (set/baca cookie)
  api/proxy/[...path]/route.ts          # proxy otentikasi ke Laravel
  login/page.tsx
  admin/layout.tsx + admin/*/page.tsx   # panel Admin (role-gated)
  ustadz/layout.tsx + ustadz/*/page.tsx # panel Ustadz (role-gated)
components/                              # Sidebar, Topbar, StatCard, dst.
lib/
  auth-context.tsx   # React Context (user, login, logout)
  api-client.ts       # fetch wrapper client-side (lewat /api/proxy)
  session.ts           # helper cookie httpOnly (server-only)
  nav.ts                # definisi menu sidebar per role
  use-penugasan.ts       # deteksi penugasan aktif Ustadz
```

## Yang belum dibangun (langkah selanjutnya)

Semua item sidebar sudah punya route + role guard, tapi isinya masih
`PlaceholderPage`. Urutan yang disarankan mengikuti prioritas PRD Fase 1:
Data Santri → Absensi → Nilai/Rapor → Keuangan → Perizinan → sisanya.
