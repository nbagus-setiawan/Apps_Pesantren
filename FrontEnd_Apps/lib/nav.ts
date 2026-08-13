import { ComponentType } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCog,
  School,
  ArrowRightLeft,
  BedDouble,
  Scale,
  Wallet,
  FileText,
  Car,
  ShieldCheck,
  Megaphone,
  LineChart,
  Settings,
  ClipboardCheck,
  FileEdit,
  BookOpen,
  CalendarDays,
  FileCheck,
  CircleDollarSign,
  LucideProps
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<LucideProps>;
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Manajemen User', href: '/admin/users', icon: Users },
  { label: 'Data Santri', href: '/admin/santri', icon: GraduationCap },
  { label: 'Data Kepegawaian', href: '/admin/kepegawaian', icon: UserCog },
  { label: 'Kelas & Tahun Ajaran', href: '/admin/kelas', icon: School },
  { label: 'Approval Pindah Kelas', href: '/admin/pindah-kelas', icon: ArrowRightLeft },
  { label: 'Asrama & Kamar', href: '/admin/asrama', icon: BedDouble },
  { label: 'Jenis Pelanggaran & Rekap Poin', href: '/admin/pelanggaran', icon: Scale },
  { label: 'Keuangan', href: '/admin/keuangan', icon: Wallet },
  { label: 'Perizinan', href: '/admin/perizinan', icon: FileText },
  { label: 'Penjemputan', href: '/admin/penjemputan', icon: Car },
  { label: 'Manajemen Penugasan', href: '/admin/penugasan', icon: ShieldCheck },
  { label: 'Pengumuman & Kegiatan', href: '/admin/pengumuman', icon: Megaphone },
  { label: 'Laporan', href: '/admin/laporan', icon: LineChart },
  { label: 'Pengaturan Sistem', href: '/admin/pengaturan', icon: Settings },
];

export const USTADZ_NAV_BASE: NavItem[] = [
  { label: 'Dashboard', href: '/ustadz/dashboard', icon: LayoutDashboard },
  { label: 'Kelas Saya', href: '/ustadz/kelas', icon: School },
  { label: 'Absensi', href: '/ustadz/absensi', icon: ClipboardCheck },
  { label: 'Nilai & Catatan Perkembangan', href: '/ustadz/nilai', icon: FileEdit },
  { label: 'Hafalan (Tahfidz)', href: '/ustadz/hafalan', icon: BookOpen },
  { label: 'Poin Pelanggaran', href: '/ustadz/pelanggaran', icon: Scale },
  { label: 'Ajukan Pindah Kelas Santri', href: '/ustadz/pindah-kelas', icon: ArrowRightLeft },
  { label: 'Izin/Cuti Saya', href: '/ustadz/izin', icon: CalendarDays },
];

export const USTADZ_NAV_PERIZINAN: NavItem = {
  label: 'Perizinan Santri',
  href: '/ustadz/perizinan',
  icon: FileCheck,
};

export const USTADZ_NAV_KEUANGAN: NavItem = {
  label: 'Keuangan',
  href: '/ustadz/keuangan',
  icon: CircleDollarSign,
};