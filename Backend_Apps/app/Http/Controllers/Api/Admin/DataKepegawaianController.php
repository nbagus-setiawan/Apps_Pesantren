<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DataKepegawaian;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\User;
use Illuminate\Http\Request;

class DataKepegawaianController extends Controller
{
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'nip_nuptk' => ['nullable', 'string'],
            'alamat' => ['nullable', 'string'],
            'pendidikan_terakhir' => ['nullable', 'string'],
            'tanggal_mulai_tugas' => ['required', 'date'],
            'status_kepegawaian' => ['required', 'in:tetap,honorer,magang'],
        ]);

        $kepegawaian = DataKepegawaian::updateOrCreate(['user_id' => $user->id], $data);

        return response()->json($kepegawaian);
    }

    public function show(User $user)
    {
        return response()->json($user->dataKepegawaian);
    }

    /**
     * Rekap jadwal mengajar seorang Ustadz: kelas di mana ia jadi wali kelas
     * ATAU mata pelajaran yang ia ajar (PRD §4.1: "Lihat jadwal mengajar per
     * Ustadz (rekap dari data kelas & mapel yang diampu)").
     *
     * Endpoint: GET /api/admin/kepegawaian/{user}/jadwal
     */
    public function jadwal(User $user)
    {
        abort_unless($user->isUstadz(), 422, 'User ini bukan Ustadz.');

        $sebagaiWaliKelas = Kelas::with('tahunAjaran')
            ->where('wali_kelas_id', $user->id)
            ->withCount('santri')
            ->get();

        $sebagaiPengajarMapel = MataPelajaran::with(['kelas.tahunAjaran'])
            ->where('ustadz_id', $user->id)
            ->get();

        return response()->json([
            'ustadz' => [
                'id' => $user->id,
                'nama' => $user->name,
            ],
            'wali_kelas' => $sebagaiWaliKelas->map(fn ($k) => [
                'kelas_id' => $k->id,
                'nama_kelas' => $k->nama,
                'tingkat' => $k->tingkat,
                'tahun_ajaran' => $k->tahunAjaran?->nama,
                'jumlah_santri' => $k->santri_count,
            ]),
            'mata_pelajaran' => $sebagaiPengajarMapel->map(fn ($mp) => [
                'mapel_id' => $mp->id,
                'nama_mapel' => $mp->nama,
                'kelas_id' => $mp->kelas_id,
                'nama_kelas' => $mp->kelas?->nama,
                'tahun_ajaran' => $mp->kelas?->tahunAjaran?->nama,
            ]),
        ]);
    }
}