<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Rapor {{ $santri->nama }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #111827; }
        h1 { font-size: 16px; margin-bottom: 2px; }
        .sub { color: #6B7280; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #E5E7EB; padding: 6px 8px; text-align: left; }
        th { background: #F3F4F6; }
        .ringkasan { margin-bottom: 12px; }
        .ringkasan div { margin-bottom: 2px; }
        .catatan-item { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB; }
        .catatan-item .meta { color: #6B7280; font-size: 11px; }
        .rata { font-weight: bold; }
    </style>
</head>
<body>
    <h1>Rapor Santri</h1>
    <div class="sub">
        Dokumen ini adalah versi sederhana, bukan format rapor resmi cetak pesantren.
    </div>

    <div class="ringkasan">
        <div><strong>Nama</strong>: {{ $santri->nama }}</div>
        <div><strong>NIS</strong>: {{ $santri->nis }}</div>
        <div><strong>Semester</strong>: {{ $semester ?? 'Semua' }}</div>
        <div><strong>Tahun Ajaran</strong>: {{ $tahunAjaran->nama ?? '-' }}</div>
        <div class="rata"><strong>Rata-rata Nilai</strong>: {{ $rataRata ?? '-' }}</div>
    </div>

    <h2>Nilai per Mata Pelajaran</h2>
    <table>
        <thead>
            <tr>
                <th>Mata Pelajaran</th>
                <th>Nilai Angka</th>
                <th>Nilai Huruf</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($nilai as $n)
                <tr>
                    <td>{{ $n->mapel?->nama ?? '-' }}</td>
                    <td>{{ $n->nilai_angka }}</td>
                    <td>{{ $n->nilai_huruf ?? '-' }}</td>
                    <td>{{ $n->keterangan ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4">Belum ada data nilai untuk periode ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Catatan Perkembangan</h2>
    @forelse ($catatan as $c)
        <div class="catatan-item">
            <div class="meta">{{ $c->tanggal?->format('d-m-Y') }} — dicatat oleh {{ $c->ustadz?->name ?? '-' }}</div>
            <div>{{ $c->isi }}</div>
        </div>
    @empty
        <p>Belum ada catatan perkembangan untuk periode ini.</p>
    @endforelse
</body>
</html>
