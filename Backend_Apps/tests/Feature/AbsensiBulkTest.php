<?php

namespace Tests\Feature;

use App\Models\Absensi;
use App\Models\Kelas;
use App\Models\Santri;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AbsensiBulkTest extends TestCase
{
    use RefreshDatabase;

    private function buatKelasDenganSantri(User $waliKelas, int $jumlahSantri): array
    {
        $tahunAjaran = TahunAjaran::create(['nama' => '2026/2027', 'is_active' => true]);

        $kelas = Kelas::create([
            'nama' => 'Kelas 7A',
            'tingkat' => 'SMP',
            'wali_kelas_id' => $waliKelas->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
        ]);

        $santriList = collect(range(1, $jumlahSantri))->map(
            fn ($i) => Santri::create([
                'nis' => '2026700'.$i,
                'nama' => "Santri {$i}",
                'jenis_kelamin' => 'L',
                'tanggal_lahir' => '2012-01-01',
                'kelas_id' => $kelas->id,
                'tanggal_masuk' => '2026-07-01',
                'status' => 'aktif',
            ])
        );

        return [$kelas, $santriList];
    }

    public function test_absensi_bulk_tersimpan_untuk_semua_santri_yang_valid(): void
    {
        $ustadz = User::factory()->ustadz()->create();
        [$kelas, $santriList] = $this->buatKelasDenganSantri($ustadz, 3);

        $payload = [
            'tanggal' => '2026-08-10',
            'data' => $santriList->map(fn ($s) => [
                'santri_id' => $s->id,
                'status' => 'hadir',
            ])->toArray(),
        ];

        $response = $this->actingAs($ustadz, 'sanctum')
            ->postJson('/api/ustadz/absensi/bulk', $payload);

        $response->assertOk();
        $this->assertSame(3, Absensi::whereDate('tanggal', '2026-08-10')->count());
    }

    public function test_absensi_bulk_ditolak_seluruhnya_jika_ada_santri_di_luar_kelas_diampu(): void
    {
        $ustadz = User::factory()->ustadz()->create();
        [$kelas, $santriList] = $this->buatKelasDenganSantri($ustadz, 2);

        // Santri di kelas lain, tidak diampu ustadz ini
        $tahunAjaranLain = TahunAjaran::create(['nama' => '2025/2026', 'is_active' => false]);
        $kelasLain = Kelas::create([
            'nama' => 'Kelas 9Z',
            'tingkat' => 'SMP',
            'tahun_ajaran_id' => $tahunAjaranLain->id,
        ]);
        $santriLuar = Santri::create([
            'nis' => '9999999',
            'nama' => 'Santri Luar',
            'jenis_kelamin' => 'P',
            'tanggal_lahir' => '2012-01-01',
            'kelas_id' => $kelasLain->id,
            'tanggal_masuk' => '2026-07-01',
            'status' => 'aktif',
        ]);

        $payload = [
            'tanggal' => '2026-08-10',
            'data' => [
                ['santri_id' => $santriList[0]->id, 'status' => 'hadir'],
                ['santri_id' => $santriLuar->id, 'status' => 'hadir'],
            ],
        ];

        $response = $this->actingAs($ustadz, 'sanctum')
            ->postJson('/api/ustadz/absensi/bulk', $payload);

        $response->assertUnprocessable();

        // Pastikan tidak ada absensi yang tersimpan sama sekali (all-or-nothing),
        // bukan hanya santri yang valid saja yang tersimpan.
        $this->assertSame(0, Absensi::whereDate('tanggal', '2026-08-10')->count());
    }

    public function test_absensi_bulk_dengan_data_hari_yang_sama_menimpa_bukan_duplikat(): void
    {
        $ustadz = User::factory()->ustadz()->create();
        [$kelas, $santriList] = $this->buatKelasDenganSantri($ustadz, 1);
        $santri = $santriList->first();

        Absensi::create([
            'santri_id' => $santri->id,
            'tanggal' => '2026-08-10',
            'status' => 'sakit',
            'dicatat_oleh' => $ustadz->id,
        ]);

        $response = $this->actingAs($ustadz, 'sanctum')
            ->postJson('/api/ustadz/absensi/bulk', [
                'tanggal' => '2026-08-10',
                'data' => [
                    ['santri_id' => $santri->id, 'status' => 'hadir'],
                ],
            ]);

        $response->assertOk();
        $this->assertSame(1, Absensi::whereDate('tanggal', '2026-08-10')->count());
        $this->assertSame('hadir', Absensi::whereDate('tanggal', '2026-08-10')->first()->status);
    }
}