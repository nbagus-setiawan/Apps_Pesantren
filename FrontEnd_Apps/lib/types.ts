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
  /**
   * Tidak dikirim langsung oleh GET /api/me di backend saat ini — diisi di
   * sisi klien lewat panggilan tambahan (mis. GET /api/ustadz/... yang
   * menyertakan status penugasan) bila diperlukan untuk render menu
   * dinamis (lihat DESIGN.md §5.2 & §9). Opsional, boleh kosong.
   */
  penugasan?: Penugasan[];
}

export interface ApiErrorShape {
  message: string;
  errors?: Record<string, string[]>;
}
