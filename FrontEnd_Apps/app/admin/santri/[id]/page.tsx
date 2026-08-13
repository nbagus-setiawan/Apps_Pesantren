'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { SantriFormModal } from '@/components/santri/SantriFormModal';
import { PindahKelasModal } from '@/components/santri/PindahKelasModal';
import { AddWaliModal } from '@/components/santri/AddWaliModal';
import type { Santri, StatusSantri } from '@/lib/types';
import { ArrowLeft, Edit3, ArrowRightLeft, UserPlus, Trash2, Shield, Calendar, User, Building2, MapPin } from 'lucide-react';

const STATUS_TONE: Record<StatusSantri, 'success' | 'warning' | 'danger' | 'neutral'> = {
  aktif: 'success',
  cuti: 'warning',
  alumni: 'neutral',
  keluar: 'danger',
};

const STATUS_LABEL: Record<StatusSantri, string> = {
  aktif: 'Aktif',
  cuti: 'Cuti',
  alumni: 'Alumni',
  keluar: 'Keluar',
};

const HUBUNGAN_LABEL: Record<string, string> = {
  ayah: 'Ayah',
  ibu: 'Ibu',
  wali: 'Wali',
};

export default function SantriDetailPage() {
  const params = useParams<{ id: string }>();
  const santriId = params.id;

  const [santri, setSantri] = useState<Santri | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [pindahOpen, setPindahOpen] = useState(false);
  const [addWaliOpen, setAddWaliOpen] = useState(false);
  const [removeWaliTarget, setRemoveWaliTarget] = useState<{ id: number; nama: string } | null>(null);
  const [removingWali, setRemovingWali] = useState(false);

  const fetchSantri = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Santri>(`admin/santri/${santriId}`);
      setSantri(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat detail santri.');
    } finally {
      setLoading(false);
    }
  }, [santriId]);

  useEffect(() => {
    fetchSantri();
  }, [fetchSantri]);

  async function handleRemoveWali() {
    if (!removeWaliTarget || !santri) return;
    setRemovingWali(true);
    try {
      await apiFetch(`admin/santri/${santri.id}/wali/${removeWaliTarget.id}`, { method: 'DELETE' });
      setRemoveWaliTarget(null);
      fetchSantri();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal melepas wali.');
    } finally {
      setRemovingWali(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500" />
          <span className="text-sm font-medium">Memuat data santri…</span>
        </div>
      </div>
    );
  }

  if (error && !santri) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/admin/santri" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
          <ArrowLeft size={16} /> Kembali ke Data Santri
        </Link>
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700 shadow-xs mt-4">
          {error}
        </div>
      </div>
    );
  }

  if (!santri) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8 pb-16">
      {/* Tautan Kembali */}
      <div>
        <Link href="/admin/santri" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
          <ArrowLeft size={16} /> Kembali ke Data Santri
        </Link>
      </div>

      {/* Header Halaman Detail */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-heading">{santri.nama}</h1>
            <Badge tone={STATUS_TONE[santri.status]}>{STATUS_LABEL[santri.status]}</Badge>
          </div>
          <p className="text-sm font-medium text-neutral-500 flex items-center gap-2">
            <span>NIS: <strong className="text-neutral-800">{santri.nis}</strong></span>
            <span>·</span>
            <span className="capitalize">Jenis Kelamin: {santri.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-xs transition-all"
            onClick={() => setPindahOpen(true)}
          >
            <ArrowRightLeft size={16} className="text-primary-600" />
            Pindah Kelas
          </button>
          <button 
            className="inline-flex items-center gap-2 bg-[#0052FF] hover:bg-[#0040CC] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
            onClick={() => setEditOpen(true)}
          >
            <Edit3 size={16} />
            Edit Biodata
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700 shadow-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Grid Informasi Utama */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Biodata Lengkap */}
        <div className="card p-6 lg:col-span-2 shadow-sm border border-neutral-100 rounded-2xl bg-white space-y-4">
          <h2 className="text-base font-semibold text-neutral-900 font-heading flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Shield size={18} className="text-primary-600" />
            Informasi Biodata Santri
          </h2>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-1">
            <Item label="Tanggal Lahir" value={santri.tanggal_lahir ?? '-'} icon={<Calendar size={15} />} />
            <Item label="Jenis Kelamin" value={santri.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} icon={<User size={15} />} />
            <Item label="Kelas Saat Ini" value={santri.kelas?.nama ?? 'Belum ada kelas'} icon={<Building2 size={15} />} />
            <Item label="Kamar Asrama" value={santri.kamar?.nama ?? 'Belum ada kamar'} icon={<Building2 size={15} />} />
            {santri.alamat !== undefined && <Item label="Alamat Domisili" value={santri.alamat || '-'} full icon={<MapPin size={15} />} />}
          </dl>
        </div>

        {/* Daftar Wali Santri */}
        <div className="card p-6 shadow-sm border border-neutral-100 rounded-2xl bg-white flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-base font-semibold text-neutral-900 font-heading flex items-center gap-2">
                Wali Santri
              </h2>
              <button 
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100/60 px-2.5 py-1.5 rounded-lg transition-colors"
                onClick={() => setAddWaliOpen(true)}
              >
                <UserPlus size={14} /> Hubungkan
              </button>
            </div>

            {(!santri.wali || santri.wali.length === 0) && (
              <div className="py-8 text-center">
                <p className="text-sm text-neutral-400">Belum ada wali yang terhubung dengan santri ini.</p>
              </div>
            )}

            <ul className="space-y-3">
              {santri.wali?.map((w) => (
                <li key={w.id} className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 transition-all hover:bg-neutral-50">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{w.nama}</p>
                    <p className="text-xs font-medium text-primary-600 mt-0.5">Hubungan: {HUBUNGAN_LABEL[w.hubungan] ?? w.hubungan}</p>
                  </div>
                  <button
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Lepas Wali"
                    onClick={() => setRemoveWaliTarget({ id: w.id, nama: w.nama })}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <SantriFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={fetchSantri}
        santri={santri}
      />

      <PindahKelasModal
        open={pindahOpen}
        onClose={() => setPindahOpen(false)}
        onMoved={fetchSantri}
        santri={santri}
      />

      <AddWaliModal
        open={addWaliOpen}
        onClose={() => setAddWaliOpen(false)}
        onAdded={fetchSantri}
        santri={santri}
      />

      <Modal
        open={Boolean(removeWaliTarget)}
        onClose={() => setRemoveWaliTarget(null)}
        title="Lepas Hubungan Wali"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button 
              className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all shadow-xs" 
              onClick={() => setRemoveWaliTarget(null)} 
              disabled={removingWali}
            >
              Batal
            </button>
            <button 
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-500/20 transition-all disabled:opacity-50" 
              onClick={handleRemoveWali} 
              disabled={removingWali}
            >
              {removingWali ? 'Memproses…' : 'Ya, Lepas'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-neutral-700 leading-relaxed">
          Apakah kamu yakin ingin melepaskan <span className="font-semibold text-neutral-900">{removeWaliTarget?.nama}</span> dari daftar wali santri <span className="font-semibold text-neutral-900">{santri.nama}</span>?
        </p>
      </Modal>
    </div>
  );
}

function Item({ label, value, full, icon }: { label: string; value: string; full?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={full ? 'sm:col-span-2 space-y-1' : 'space-y-1'}>
      <dt className="text-xs uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium text-neutral-900 pl-5">{value}</dd>
    </div>
  );
}