<?php

namespace App\Http\Controllers\Api\Ustadz;

use App\Http\Controllers\Concerns\ScopedToKelasDiampu;
use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AbsensiController extends Controller
{
    use ScopedToKelasDiampu;

    /**
     * Input absensi harian per kelas (bulk).
     *
     * PERBAIKAN 1: seluruh loop dibungkus DB::transaction() agar tidak ada
     * kondisi absensi tersimpan sebagian saja jika terjadi error di
     * tengah batch.
     *
     * PERBAIKAN 2 (bug asli, ditemukan lewat test): sebelumnya kode
     * memakai updateOrCreate() dengan kunci pencarian
     * ['santri_id' => ..., 'tanggal' => $data['tanggal']] — di mana
     * $data['tanggal'] adalah string mentah dari request (mis.
     * '2026-08-10'), TANPA melalui cast model. Karena kolom 'tanggal'
     * di-cast 'date' pada model Absensi, nilai yang tersimpan di
     * database sebenarnya berbentuk '2026-08-10 00:00:00'. Akibatnya
     * klausa WHERE pada updateOrCreate() tidak pernah menemukan baris
     * yang sudah ada, sehingga selalu mencoba INSERT baru — dan begitu
     * ada baris lama untuk kombinasi santri+tanggal yang sama, INSERT
     * ini melanggar unique constraint (santri_id, tanggal) dan
     * menyebabkan request gagal dengan error 500.
     *
     * Diperbaiki dengan mencari baris yang sudah ada memakai whereDate()
     * — pola yang sama persis sudah dipakai di method index() pada
     * controller ini — lalu update() jika ditemukan, atau create() jika
     * belum ada.
     */
    public function storeBulk(Request $request)
    {
        $data = $request->validate([
            'tanggal' => ['required', 'date'],
            'data' => ['required', 'array'],
            'data.*.santri_id' => ['required', 'exists:santri,id'],
            'data.*.status' => ['required', 'in:hadir,sakit,izin,alpa'],
            'data.*.keterangan' => ['nullable', 'string'],
        ]);

        $kelasIds = $this->kelasDiampuIds($request);
        $santriIds = collect($data['data'])->pluck('santri_id')->unique();

        $santriValidCount = Santri::whereIn('id', $santriIds)
            ->whereIn('kelas_id', $kelasIds)
            ->count();

        if ($santriValidCount !== $santriIds->count()) {
            throw ValidationException::withMessages([
                'data' => ['Terdapat santri yang tidak berada di kelas yang Anda ampu.'],
            ]);
        }

        DB::transaction(function () use ($data, $request) {
            foreach ($data['data'] as $row) {
                $absensi = Absensi::where('santri_id', $row['santri_id'])
                    ->whereDate('tanggal', $data['tanggal'])
                    ->first();

                $atribut = [
                    'status' => $row['status'],
                    'keterangan' => $row['keterangan'] ?? null,
                    'dicatat_oleh' => $request->user()->id,
                ];

                if ($absensi) {
                    $absensi->update($atribut);
                } else {
                    Absensi::create([
                        'santri_id' => $row['santri_id'],
                        'tanggal' => $data['tanggal'],
                        ...$atribut,
                    ]);
                }
            }
        });

        return response()->json(['message' => 'Absensi tersimpan.']);
    }

    public function index(Request $request)
    {
        $kelasIds = $this->kelasDiampuIds($request);

        return response()->json(
            Absensi::with('santri')
                ->whereHas('santri', fn ($q) => $q->whereIn('kelas_id', $kelasIds))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->when($request->tanggal, fn ($q) => $q->whereDate('tanggal', $request->tanggal))
                ->paginate($request->integer('per_page', 30))
        );
    }
}