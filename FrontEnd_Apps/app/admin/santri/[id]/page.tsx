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
          <span className="text-sm">Memuat…</span>
        </div>
      </div>
    );
  }

  if (error && !santri) {
    return (
      <div>
        <Link href="/admin/santri" className="mb-4 inline-block text-sm text-primary-700 hover:underline">
          ← Kembali ke Data Santri
        </Link>
        <div role="alert" className="rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      </div>
    );
  }

  if (!santri) return null;

  return (
    <div>
      <Link href="/admin/santri" className="mb-4 inline-block text-sm text-primary-700 hover:underline">
        ← Kembali ke Data Santri
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-h1 text-neutral-900">{santri.nama}</h1>
            <Badge tone={STATUS_TONE[santri.status]}>{STATUS_LABEL[santri.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-500">NIS {santri.nis}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setPindahOpen(true)}>
            🔀 Pindah Kelas
          </button>
          <button className="btn-primary" onClick={() => setEditOpen(true)}>
            ✏️ Edit
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-h3 mb-4 text-neutral-900">Biodata</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Item label="Jenis Kelamin" value={santri.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
            <Item label="Tanggal Lahir" value={santri.tanggal_lahir ?? '-'} />
            <Item label="Kelas" value={santri.kelas?.nama ?? '-'} />
            <Item label="Kamar" value={santri.kamar?.nama ?? '-'} />
            {santri.alamat !== undefined && <Item label="Alamat" value={santri.alamat || '-'} full />}
          </dl>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-h3 text-neutral-900">Wali Santri</h2>
            <button className="text-xs font-medium text-primary-700 hover:underline" onClick={() => setAddWaliOpen(true)}>
              + Hubungkan
            </button>
          </div>

          {(!santri.wali || santri.wali.length === 0) && (
            <p className="text-sm text-neutral-500">Belum ada wali yang terhubung ke santri ini.</p>
          )}

          <ul className="space-y-3">
            {santri.wali?.map((w) => (
              <li key={w.id} className="flex items-center justify-between rounded-control border border-neutral-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{w.nama}</p>
                  <p className="text-xs text-neutral-500">{HUBUNGAN_LABEL[w.hubungan] ?? w.hubungan}</p>
                </div>
                <button
                  className="text-xs font-medium text-danger hover:underline"
                  onClick={() => setRemoveWaliTarget({ id: w.id, nama: w.nama })}
                >
                  Lepas
                </button>
              </li>
            ))}
          </ul>
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
        title="Lepas Wali"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRemoveWaliTarget(null)} disabled={removingWali}>
              Batal
            </button>
            <button className="btn-danger-ghost" onClick={handleRemoveWali} disabled={removingWali}>
              {removingWali ? 'Memproses…' : 'Ya, Lepas'}
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-700">
          Lepas <span className="font-medium">{removeWaliTarget?.nama}</span> dari daftar wali{' '}
          <span className="font-medium">{santri.nama}</span>?
        </p>
      </Modal>
    </div>
  );
}

function Item({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-900">{value}</dd>
    </div>
  );
}
