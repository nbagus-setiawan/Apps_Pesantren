<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatatanPerkembangan;
use App\Models\Nilai;
use App\Models\Santri;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;

/**
 * PRD v1.4 §4.3 & §6:
 *   GET /api/santri/{id}/rapor       -> nilai + catatan perkembangan digabung
 *   GET /api/santri/{id}/rapor/pdf   -> versi PDF sederhana
 *
 * Akses: Wali Santri hanya untuk anaknya sendiri; Ustadz & Admin bisa lihat
 * santri manapun (dicek eksplisit di sini, bukan diasumsikan dari role saja
 * — lihat PRD §7 "Privasi data").
 */
class RaporController extends Controller
{
    private function otorisasiDanAmbilSantri(Request $request, int $santriId): Santri
    {
        $user = $request->user();

        if ($user->isWaliSantri()) {
            $santri = $user->anak()->find($santriId);
            abort_if(! $santri, 403, 'Santri ini bukan anak Anda.');

            return $santri;
        }

        // admin & ustadz: boleh lihat santri manapun
        return Santri::findOrFail($santriId);
    }

    private function dataRapor(int $santriId, ?int $semester, ?int $tahunAjaranId): array
    {
        $tahunAjaranId ??= TahunAjaran::where('is_active', true)->value('id');

        $nilai = Nilai::with('mapel')
            ->where('santri_id', $santriId)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))
            ->get();

        $catatan = CatatanPerkembangan::with('ustadz')
            ->where('santri_id', $santriId)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))
            ->orderByDesc('tanggal')
            ->get();

        $rataRata = $nilai->count() ? round($nilai->avg('nilai_angka'), 2) : null;

        return compact('nilai', 'catatan', 'rataRata', 'semester', 'tahunAjaranId');
    }

    public function index(Request $request, int $santriId)
    {
        $santri = $this->otorisasiDanAmbilSantri($request, $santriId);

        $data = $this->dataRapor(
            $santriId,
            $request->integer('semester') ?: null,
            $request->integer('tahun_ajaran_id') ?: null
        );

        return response()->json([
            'santri' => [
                'id' => $santri->id,
                'nis' => $santri->nis,
                'nama' => $santri->nama,
            ],
            'semester' => $data['semester'],
            'tahun_ajaran_id' => $data['tahunAjaranId'],
            'rata_rata' => $data['rataRata'],
            'nilai' => $data['nilai']->map(fn ($n) => [
                'mapel' => $n->mapel?->nama,
                'nilai_angka' => $n->nilai_angka,
                'nilai_huruf' => $n->nilai_huruf,
                'keterangan' => $n->keterangan,
            ]),
            'catatan_perkembangan' => $data['catatan']->map(fn ($c) => [
                'tanggal' => $c->tanggal?->format('Y-m-d'),
                'isi' => $c->isi,
                'ustadz' => $c->ustadz?->name,
            ]),
        ]);
    }

    /** Unduh rapor sebagai PDF sederhana (PRD §4.3: bukan format resmi cetak) */
    public function pdf(Request $request, int $santriId)
    {
        $santri = $this->otorisasiDanAmbilSantri($request, $santriId);

        $data = $this->dataRapor(
            $santriId,
            $request->integer('semester') ?: null,
            $request->integer('tahun_ajaran_id') ?: null
        );

        $tahunAjaran = TahunAjaran::find($data['tahunAjaranId']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('rapor.pdf', [
            'santri' => $santri,
            'semester' => $data['semester'],
            'tahunAjaran' => $tahunAjaran,
            'rataRata' => $data['rataRata'],
            'nilai' => $data['nilai'],
            'catatan' => $data['catatan'],
        ]);

        $namaFile = 'rapor-'.$santri->nis.'-'.($data['semester'] ?? 'all').'.pdf';

        return $pdf->download($namaFile);
    }
}
