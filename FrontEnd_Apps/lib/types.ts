export type Role = 'admin' | 'ustadz' | 'wali_santri';

export interface Penugasan {
  id: number;
  jenis_tugas: 'perizinan' | 'keuangan';
  is_active: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  avatar: string | null;
  is_active: boolean;
  penugasan?: Penugasan[];
}

export interface ApiErrorShape {
  message: string;
  errors?: Record<string, string[]>;
}

/** Bentuk standar respons ->paginate() Laravel. */
export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// ── Modul Data Santri ──────────────────────────────────────────

export type JenisKelamin = 'L' | 'P';
export type StatusSantri = 'aktif' | 'alumni' | 'keluar' | 'cuti';

export interface KelasRingkas {
  id: number;
  nama: string;
}

export interface KamarRingkas {
  id: number;
  nama: string;
}

export interface WaliRingkas {
  id: number;
  nama: string;
  hubungan: 'ayah' | 'ibu' | 'wali';
}

/** Sesuai App\Http\Resources\SantriResource */
export interface Santri {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: JenisKelamin;
  tanggal_lahir: string | null;
  status: StatusSantri;
  alamat?: string | null;
  tanggal_masuk?: string | null;
  kelas?: KelasRingkas | null;
  kamar?: KamarRingkas | null;
  wali?: WaliRingkas[];
}

export interface KelasOption {
  id: number;
  nama: string;
  tingkat: string;
  tahun_ajaran_id: number;
  tahun_ajaran?: { nama: string } | null;
}

export interface KamarOption {
  id: number;
  nama: string;
  kapasitas: number;
  asrama_id: number;
  asrama?: { nama: string } | null;
}

export interface ImportGagalRow {
  baris: number;
  nis: string | null;
  errors: string[];
}

export interface ImportSantriResponse {
  message: string;
  total_berhasil: number;
  total_gagal: number;
  detail_gagal: ImportGagalRow[];
}

// ── Modul Ustadz: Kelas Diampu & Absensi ───────────────────────

export interface KelasDiampu {
  id: number;
  nama: string;
  tingkat: string;
  santri_count: number;
  tahun_ajaran?: { nama: string } | null;
}

/** Bentuk mentah model Santri (bukan lewat SantriResource) — dipakai oleh
 *  GET /api/ustadz/kelas/{id}/santri, yang mengembalikan Eloquent model
 *  apa adanya, bukan resource yang sudah dipangkas. */
export interface SantriRingkasKelas {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: JenisKelamin;
  status: StatusSantri;
}

export type StatusAbsensi = 'hadir' | 'sakit' | 'izin' | 'alpa';

/** Bentuk mentah model Absensi (relasi `santri` dimuat di index()). */
export interface AbsensiRecord {
  id: number;
  santri_id: number;
  tanggal: string;
  status: StatusAbsensi;
  keterangan: string | null;
  dicatat_oleh: number;
  santri?: { id: number; nis: string; nama: string } | null;
}
