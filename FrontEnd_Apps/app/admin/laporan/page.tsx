'use client';

import { useState } from 'react';
import { useKelasOptions } from '@/lib/use-options';
import { Tabs } from '@/components/admin/Tabs';

type TabKey = 'absensi' | 'keuangan';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthIso() {
  return todayIso().slice(0, 8) + '01';
}

export default function LaporanPage() {
  const [tab, setTab] = useState<TabKey>('absensi');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">Laporan</h1>
        <p className="mt-1 text-sm text-neutral-500">Unduh laporan kehadiran dan keuangan (CSV/PDF).</p>
      </div>

      <Tabs
        tabs={[
          { key: 'absensi', label: 'Laporan Absensi' },
          { key: 'keuangan', label: 'Laporan Keuangan' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as TabKey)}
      />

      {tab === 'absensi' && <LaporanAbsensiTab />}
      {tab === 'keuangan' && <LaporanKeuanganTab />}
    </div>
  );
}

function LaporanAbsensiTab() {
  const { options: kelasOptions } = useKelasOptions();
  const [dari, setDari] = useState(firstOfMonthIso());
  const [sampai, setSampai] = useState(todayIso());
  const [kelasId, setKelasId] = useState('');

  function buildUrl(format: 'csv' | 'pdf') {
    const params = new URLSearchParams({ dari, sampai, format });
    if (kelasId) params.set('kelas_id', kelasId);
    return `/api/proxy/admin/laporan/absensi?${params.toString()}`;
  }

  return (
    <div className="card p-6">
      <h2 className="text-h3 mb-4 text-neutral-900">Unduh Laporan Absensi</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Dari Tanggal</span>
          <input type="date" className="input-field" value={dari} onChange={(e) => setDari(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Sampai Tanggal</span>
          <input type="date" className="input-field" value={sampai} onChange={(e) => setSampai(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Kelas (opsional)</span>
          <select className="select-field" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
            <option value="">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <a href={buildUrl('csv')} className="btn-secondary">
          ⬇ Unduh CSV
        </a>
        <a href={buildUrl('pdf')} className="btn-primary">
          ⬇ Unduh PDF
        </a>
      </div>
    </div>
  );
}

function LaporanKeuanganTab() {
  const [dari, setDari] = useState(firstOfMonthIso());
  const [sampai, setSampai] = useState(todayIso());
  const [status, setStatus] = useState('');

  function buildUrl(format: 'csv' | 'pdf') {
    const params = new URLSearchParams({ dari, sampai, format });
    if (status) params.set('status', status);
    return `/api/proxy/admin/laporan/keuangan?${params.toString()}`;
  }

  return (
    <div className="card p-6">
      <h2 className="text-h3 mb-4 text-neutral-900">Unduh Laporan Keuangan</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Dari Tanggal</span>
          <input type="date" className="input-field" value={dari} onChange={(e) => setDari(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Sampai Tanggal</span>
          <input type="date" className="input-field" value={sampai} onChange={(e) => setSampai(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">Status (opsional)</span>
          <select className="select-field" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="belum_bayar">Belum Bayar</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="lunas">Lunas</option>
            <option value="telat">Telat</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <a href={buildUrl('csv')} className="btn-secondary">
          ⬇ Unduh CSV
        </a>
        <a href={buildUrl('pdf')} className="btn-primary">
          ⬇ Unduh PDF
        </a>
      </div>
    </div>
  );
}