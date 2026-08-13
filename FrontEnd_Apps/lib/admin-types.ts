import type { Paginated, Role } from './types';

// ── Manajemen User ──────────────────────────────────────────

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  avatar: string | null;
  created_at?: string;
}

// ── Kelas & Tahun Ajaran ────────────────────────────────────

export interface TahunAjaran {
  id: number;
  nama: string;
  is_active: boolean;
}

export interface KelasAdmin {
  id: number;
  nama: string;
  tingkat: string;
  wali_kelas_id: number | null;
  tahun_ajaran_id: number;
  wali_kelas?: { id: number; name: string } | null;
  tahun_ajaran?: { id: number; nama: string } | null;
  santri_count?: number;
}

export interface MataPelajaran {
  id: number;
  nama: string;
  kelas_id: number;
  ustadz_id: number;
  kelas?: { id: number; nama: string } | null;
  ustadz?: { id: number; name: string } | null;
}

// ── Data Kepegawaian ────────────────────────────────────────

export type StatusKepegawaian = 'tetap' | 'honorer' | 'magang';

export interface DataKepegawaian {
  id?: number;
  user_id: number;
  nip_nuptk: string | null;
  alamat: string | null;
  pendidikan_terakhir: string | null;
  tanggal_mulai_tugas: string;
  status_kepegawaian: StatusKepegawaian;
}

export interface JadwalUstadz {
  ustadz: { id: number; nama: string };
  wali_kelas: {
    kelas_id: number;
    nama_kelas: string;
    tingkat: string;
    tahun_ajaran: string | null;
    jumlah_santri: number;
  }[];
  mata_pelajaran: {
    mapel_id: number;
    nama_mapel: string;
    kelas_id: number;
    nama_kelas: string | null;
    tahun_ajaran: string | null;
  }[];
}

export type StatusIzin = 'pending' | 'disetujui' | 'ditolak';

export interface IzinUstadz {
  id: number;
  ustadz_id: number;
  jenis: 'cuti' | 'sakit' | 'izin_lain';
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  status: StatusIzin;
  ustadz?: { id: number; name: string } | null;
}

// ── Asrama & Kamar ──────────────────────────────────────────

export interface Asrama {
  id: number;
  nama: string;
  pembina_id: number | null;
  pembina?: { id: number; name: string } | null;
  kamar_count?: number;
  kamar?: KamarAdmin[];
}

export interface KamarAdmin {
  id: number;
  nama: string;
  kapasitas: number;
  asrama_id: number;
  asrama?: { id: number; nama: string } | null;
  santri_count?: number;
  santri?: { id: number; nama: string; nis: string }[];
}

// ── Jenis Pelanggaran & Rekap Poin ──────────────────────────

export type KategoriPelanggaran = 'ringan' | 'sedang' | 'berat';

export interface JenisPelanggaran {
  id: number;
  nama: string;
  poin: number;
  kategori: KategoriPelanggaran;
}

export interface RekapPelanggaranSantri {
  id: number;
  nis: string;
  nama: string;
  kelas?: { id: number; nama: string } | null;
  total_poin: number;
  melebihi_ambang_batas: boolean;
}

// ── Keuangan ─────────────────────────────────────────────────

export interface JenisTagihan {
  id: number;
  nama: string;
  nominal_default: number;
  tipe: 'bulanan' | 'sekali' | 'tahunan';
}

export type StatusTagihan = 'belum_bayar' | 'menunggu_verifikasi' | 'lunas' | 'telat';

export interface TagihanMonitoring {
  id: number;
  periode: string;
  nominal: number;
  jatuh_tempo: string | null;
  status: StatusTagihan;
  santri?: { id: number; nama: string } | null;
  jenis_tagihan?: string | null;
  pembayaran?: {
    id: number;
    jumlah_bayar: number;
    status: string;
    tanggal_bayar: string | null;
  }[];
}

// ── Perizinan (monitoring) ──────────────────────────────────

export type StatusPerizinan = 'pending' | 'disetujui' | 'ditolak';

export interface PerizinanMonitoring {
  id: number;
  jenis: 'sakit' | 'izin_pulang' | 'keperluan_lain';
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
  status: StatusPerizinan;
  catatan: string | null;
  santri?: { id: number; nama: string } | null;
  diajukan_oleh?: { id: number; name: string } | null;
}

// ── Penjemputan ──────────────────────────────────────────────

export interface PenjemputanLog {
  id: number;
  santri: string | null;
  diajukan_oleh: string | null;
  kode_qr: string | null;
  qr_berlaku_sampai: string | null;
  qr_digunakan_at: string | null;
  status: 'sudah_digunakan' | 'belum_digunakan' | 'menunggu' | 'kedaluwarsa';
}

// ── Manajemen Penugasan ──────────────────────────────────────

export type JenisTugas = 'perizinan' | 'keuangan';

export interface PenugasanUstadz {
  id: number;
  ustadz_id: number;
  jenis_tugas: JenisTugas;
  is_active: boolean;
  ustadz?: { id: number; name: string; email: string } | null;
}

// ── Pengumuman & Kegiatan ────────────────────────────────────

export type TargetRolePengumuman = 'semua' | 'admin' | 'ustadz' | 'wali_santri';

export interface Pengumuman {
  id: number;
  judul: string;
  isi: string;
  target_role: TargetRolePengumuman;
  target_kelas_id: number | null;
  created_at?: string;
}

export interface Kegiatan {
  id: number;
  judul: string;
  deskripsi: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  lokasi: string | null;
}

// ── Pengaturan Sistem ────────────────────────────────────────

export interface PengaturanValues {
  nama_pesantren?: string;
  ambang_batas_poin_pelanggaran?: string;
  qr_durasi_jam?: string;
  [key: string]: string | undefined;
}

export type { Paginated };
