export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Manajemen User', href: '/admin/users', icon: '👥' },
  { label: 'Data Santri', href: '/admin/santri', icon: '🎓' },
  { label: 'Data Kepegawaian', href: '/admin/kepegawaian', icon: '🧑‍🏫' },
  { label: 'Kelas & Tahun Ajaran', href: '/admin/kelas', icon: '🏫' },
  { label: 'Asrama & Kamar', href: '/admin/asrama', icon: '🛏️' },
  { label: 'Jenis Pelanggaran & Rekap Poin', href: '/admin/pelanggaran', icon: '⚖️' },
  { label: 'Keuangan', href: '/admin/keuangan', icon: '💰' },
  { label: 'Perizinan', href: '/admin/perizinan', icon: '📄' },
  { label: 'Penjemputan', href: '/admin/penjemputan', icon: '🚗' },
  { label: 'Manajemen Penugasan', href: '/admin/penugasan', icon: '🔑' },
  { label: 'Pengumuman & Kegiatan', href: '/admin/pengumuman', icon: '📢' },
  { label: 'Pengaturan Sistem', href: '/admin/pengaturan', icon: '⚙️' },
];

export const USTADZ_NAV_BASE: NavItem[] = [
  { label: 'Dashboard', href: '/ustadz/dashboard', icon: '📊' },
  { label: 'Kelas Saya', href: '/ustadz/kelas', icon: '🏫' },
  { label: 'Absensi', href: '/ustadz/absensi', icon: '✅' },
  { label: 'Nilai & Catatan Perkembangan', href: '/ustadz/nilai', icon: '📝' },
  { label: 'Hafalan (Tahfidz)', href: '/ustadz/hafalan', icon: '📖' },
  { label: 'Poin Pelanggaran', href: '/ustadz/pelanggaran', icon: '⚖️' },
  { label: 'Ajukan Pindah Kelas Santri', href: '/ustadz/pindah-kelas', icon: '🔀' },
  { label: 'Izin/Cuti Saya', href: '/ustadz/izin', icon: '🗓️' },
];

export const USTADZ_NAV_PERIZINAN: NavItem = {
  label: 'Perizinan Santri',
  href: '/ustadz/perizinan',
  icon: '🔑',
};

export const USTADZ_NAV_KEUANGAN: NavItem = {
  label: 'Keuangan',
  href: '/ustadz/keuangan',
  icon: '🔑',
};
