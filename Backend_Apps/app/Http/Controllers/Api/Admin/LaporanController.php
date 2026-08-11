<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Tagihan;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanController extends Controller
{
    private function rentangTanggal(Request $request): array
    {
        $dari = $request->date('dari') ?? now()->startOfMonth();
        $sampai = $request->date('sampai') ?? now()->endOfMonth();

        return [$dari, $sampai];
    }

    /** GET /admin/laporan/absensi?dari=&sampai=&format=csv|pdf */
    public function absensi(Request $request)
    {
        [$dari, $sampai] = $this->rentangTanggal($request);

        $data = Absensi::with('santri')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->when($request->kelas_id, fn ($q) => $q->whereHas('santri', fn ($s) => $s->where('kelas_id', $request->kelas_id)))
            ->orderBy('tanggal')
            ->get();

        if ($request->query('format') === 'pdf') {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('laporan.absensi', [
                'data' => $data, 'dari' => $dari, 'sampai' => $sampai,
            ]);

            return $pdf->download('laporan-absensi-' . $dari->format('Ymd') . '-' . $sampai->format('Ymd') . '.pdf');
        }

        return $this->streamCsv(
            'laporan-absensi-' . $dari->format('Ymd') . '-' . $sampai->format('Ymd') . '.csv',
            ['Tanggal', 'NIS', 'Nama Santri', 'Status', 'Keterangan'],
            $data->map(fn ($a) => [
                $a->tanggal->format('Y-m-d'),
                $a->santri->nis ?? '-',
                $a->santri->nama ?? '-',
                $a->status,
                $a->keterangan ?? '-',
            ])
        );
    }

    /**
     * GET /admin/laporan/keuangan?dari=&sampai=&format=csv|pdf
     *
     * PERBAIKAN: filter periode laporan sekarang menggunakan `jatuh_tempo`,
     * BUKAN `created_at`. Alasan: tagihan bisa di-generate di muka lewat
     * POST /ustadz/tagihan/generate-bulanan (mis. seluruh tagihan bulan
     * Agustus dibuat sekaligus di akhir Juli). Kalau filter memakai
     * created_at, laporan "Agustus" akan kosong karena baris tagihan
     * tercatat created_at = Juli, padahal secara bisnis tagihan tsb
     * adalah tagihan periode Agustus (jatuh_tempo di Agustus).
     *
     * Filter jatuh_tempo lebih merepresentasikan "tagihan periode ini",
     * sesuai konsep 'periode' & 'jatuh_tempo' pada tabel tagihan.
     */
    public function keuangan(Request $request)
    {
        [$dari, $sampai] = $this->rentangTanggal($request);

        $data = Tagihan::with(['santri', 'jenisTagihan'])
            ->whereBetween('jatuh_tempo', [$dari, $sampai])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('jatuh_tempo')
            ->get();

        $totalNominal = $data->sum('nominal');
        $totalLunas = $data->where('status', 'lunas')->sum('nominal');

        if ($request->query('format') === 'pdf') {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('laporan.keuangan', [
                'data' => $data, 'dari' => $dari, 'sampai' => $sampai,
                'totalNominal' => $totalNominal, 'totalLunas' => $totalLunas,
            ]);

            return $pdf->download('laporan-keuangan-' . $dari->format('Ymd') . '-' . $sampai->format('Ymd') . '.pdf');
        }

        return $this->streamCsv(
            'laporan-keuangan-' . $dari->format('Ymd') . '-' . $sampai->format('Ymd') . '.csv',
            ['Periode', 'NIS', 'Nama Santri', 'Jenis Tagihan', 'Nominal', 'Jatuh Tempo', 'Status'],
            $data->map(fn ($t) => [
                $t->periode,
                $t->santri->nis ?? '-',
                $t->santri->nama ?? '-',
                $t->jenisTagihan->nama ?? '-',
                $t->nominal,
                $t->jatuh_tempo?->format('Y-m-d'),
                $t->status,
            ]),
            // Baris ringkasan di akhir CSV agar total selalu ikut terunduh,
            // konsisten dengan versi PDF yang sudah menampilkan totalNominal/totalLunas.
            [
                ['', '', '', '', '', '', ''],
                ['Total Nominal', '', '', '', $totalNominal, '', ''],
                ['Total Lunas', '', '', '', $totalLunas, '', ''],
            ]
        );
    }

    private function streamCsv(string $filename, array $header, iterable $rows, array $footerRows = []): StreamedResponse
    {
        return response()->streamDownload(function () use ($header, $rows, $footerRows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $header);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            foreach ($footerRows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}