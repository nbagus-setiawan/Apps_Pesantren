<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Controller;
use App\Http\Resources\TagihanResource;
use App\Models\JenisTagihan;
use App\Models\Santri;
use App\Models\Tagihan;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * PRD v1.4 §4.2 & §10: pembuatan tagihan SPP dilakukan MANUAL oleh Ustadz
 * yang ditunjuk Admin sebagai Petugas Keuangan (penugasan_ustadz.jenis_tugas
 * = 'keuangan') — bukan oleh Admin langsung, dan bukan auto-generate sistem.
 */
class TagihanController extends Controller
{
    private function pastikanBerwenang(Request $request): void
    {
        if (! $request->user()->punyaTugasAktif('keuangan')) {
            throw ValidationException::withMessages([
                'authorization' => ['Anda bukan Petugas Keuangan yang ditunjuk.'],
            ]);
        }
    }

    /** Buat tagihan untuk satu santri */
    public function store(Request $request)
    {
        $this->pastikanBerwenang($request);

        $data = $request->validate([
            'santri_id' => ['required', 'exists:santri,id'],
            'jenis_tagihan_id' => ['required', 'exists:jenis_tagihan,id'],
            'periode' => ['required', 'string'],
            'nominal' => ['required', 'numeric', 'min:0'],
            'jatuh_tempo' => ['required', 'date'],
        ]);

        $data['status'] = 'belum_bayar';
        $data['dibuat_oleh'] = $request->user()->id;

        $tagihan = Tagihan::create($data);

        return new TagihanResource($tagihan->load(['santri', 'jenisTagihan']));
    }

    /**
     * Buat tagihan untuk banyak santri sekaligus (mis. SPP bulanan seluruh
     * kelas atau seluruh santri aktif), tetap dipicu manual oleh Petugas
     * Keuangan — bukan dijadwalkan otomatis oleh sistem.
     */
    public function generateBulanan(Request $request)
    {
        $this->pastikanBerwenang($request);

        $data = $request->validate([
            'jenis_tagihan_id' => ['required', 'exists:jenis_tagihan,id'],
            'periode' => ['required', 'string'],
            'nominal' => ['nullable', 'numeric', 'min:0'],
            'jatuh_tempo' => ['required', 'date'],
            'kelas_id' => ['nullable', 'exists:kelas,id'],
        ]);

        $jenis = JenisTagihan::findOrFail($data['jenis_tagihan_id']);
        $nominal = $data['nominal'] ?? $jenis->nominal_default;

        $santriIds = Santri::where('status', 'aktif')
            ->when($data['kelas_id'] ?? null, fn ($q) => $q->where('kelas_id', $data['kelas_id']))
            ->pluck('id');

        $dibuat = 0;

        foreach ($santriIds as $santriId) {
            $sudahAda = Tagihan::where('santri_id', $santriId)
                ->where('jenis_tagihan_id', $data['jenis_tagihan_id'])
                ->where('periode', $data['periode'])
                ->exists();

            if ($sudahAda) {
                continue;
            }

            Tagihan::create([
                'santri_id' => $santriId,
                'jenis_tagihan_id' => $data['jenis_tagihan_id'],
                'periode' => $data['periode'],
                'nominal' => $nominal,
                'jatuh_tempo' => $data['jatuh_tempo'],
                'status' => 'belum_bayar',
                'dibuat_oleh' => $request->user()->id,
            ]);

            $dibuat++;
        }

        return response()->json([
            'message' => "Berhasil membuat {$dibuat} tagihan untuk periode {$data['periode']}.",
            'total_dibuat' => $dibuat,
        ], 201);
    }

    public function index(Request $request)
    {
        $this->pastikanBerwenang($request);

        return TagihanResource::collection(
            Tagihan::with(['santri', 'jenisTagihan'])
                ->when($request->status, fn ($q) => $q->where('status', $request->status))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }
}
