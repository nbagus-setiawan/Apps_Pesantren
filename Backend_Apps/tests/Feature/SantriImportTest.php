<?php

namespace Tests\Feature;

use App\Models\Santri;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class SantriImportTest extends TestCase
{
    use RefreshDatabase;

    private function buatFileCsv(string $content, string $namaFile = 'santri.csv'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($namaFile, $content);
    }

    public function test_admin_bisa_import_santri_valid_dari_csv(): void
    {
        $admin = User::factory()->admin()->create();

        $csv = "nis,nama,jenis_kelamin,tanggal_lahir,tanggal_masuk\n"
            . "2026100,Ahmad Fauzi,L,2012-05-10,2026-07-01\n"
            . "2026101,Siti Aminah,P,2012-08-15,2026-07-01\n";

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/santri/import', [
                'file' => $this->buatFileCsv($csv),
            ]);

        $response->assertCreated()
            ->assertJson([
                'total_berhasil' => 2,
                'total_gagal' => 0,
            ]);

        $this->assertDatabaseHas('santri', ['nis' => '2026100', 'nama' => 'Ahmad Fauzi']);
        $this->assertDatabaseHas('santri', ['nis' => '2026101', 'nama' => 'Siti Aminah']);
        $this->assertSame(2, Santri::count());
    }

    public function test_baris_dengan_nis_duplikat_tidak_menggagalkan_baris_lain(): void
    {
        $admin = User::factory()->admin()->create();

        // NIS 2026100 sudah ada di database sebelum import dijalankan.
        Santri::create([
            'nis' => '2026100',
            'nama' => 'Santri Lama',
            'jenis_kelamin' => 'L',
            'tanggal_lahir' => '2012-01-01',
            'tanggal_masuk' => '2025-07-01',
            'status' => 'aktif',
        ]);

        $csv = "nis,nama,jenis_kelamin,tanggal_lahir,tanggal_masuk\n"
            . "2026100,Ahmad Fauzi (duplikat),L,2012-05-10,2026-07-01\n" // gagal: NIS duplikat
            . "2026101,Siti Aminah,P,2012-08-15,2026-07-01\n";           // tetap berhasil

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/santri/import', [
                'file' => $this->buatFileCsv($csv),
            ]);

        $response->assertCreated()
            ->assertJson([
                'total_berhasil' => 1,
                'total_gagal' => 1,
            ]);

        $response->assertJsonPath('detail_gagal.0.baris', 2);
        $response->assertJsonPath('detail_gagal.0.nis', '2026100');

        // Baris kedua (NIS 2026101) tetap masuk meski baris pertama gagal.
        $this->assertDatabaseHas('santri', ['nis' => '2026101', 'nama' => 'Siti Aminah']);
        // Data lama NIS 2026100 tidak berubah/tertimpa oleh baris CSV yang gagal.
        $this->assertDatabaseHas('santri', ['nis' => '2026100', 'nama' => 'Santri Lama']);
        $this->assertSame(2, Santri::count());
    }

    public function test_import_gagal_total_jika_semua_baris_tidak_valid(): void
    {
        $admin = User::factory()->admin()->create();

        // jenis_kelamin invalid (bukan L/P) dan tanggal_lahir kosong.
        $csv = "nis,nama,jenis_kelamin,tanggal_lahir,tanggal_masuk\n"
            . "2026100,Ahmad Fauzi,X,,2026-07-01\n";

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/santri/import', [
                'file' => $this->buatFileCsv($csv),
            ]);

        $response->assertUnprocessable()
            ->assertJson([
                'total_berhasil' => 0,
                'total_gagal' => 1,
            ]);

        $this->assertSame(0, Santri::count());
    }

    public function test_import_gagal_jika_header_csv_tidak_lengkap(): void
    {
        $admin = User::factory()->admin()->create();

        // Header tanpa kolom wajib 'tanggal_masuk'.
        $csv = "nis,nama,jenis_kelamin,tanggal_lahir\n"
            . "2026100,Ahmad Fauzi,L,2012-05-10\n";

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/santri/import', [
                'file' => $this->buatFileCsv($csv),
            ]);

        $response->assertUnprocessable();
        $response->assertJsonPath('kolom_hilang.0', 'tanggal_masuk');
        $this->assertSame(0, Santri::count());
    }

    public function test_import_gagal_jika_tidak_ada_file_dikirim(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/santri/import', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['file']);
    }

    public function test_ustadz_tidak_bisa_akses_endpoint_import(): void
    {
        $ustadz = User::factory()->ustadz()->create();

        $csv = "nis,nama,jenis_kelamin,tanggal_lahir,tanggal_masuk\n"
            . "2026100,Ahmad Fauzi,L,2012-05-10,2026-07-01\n";

        $response = $this->actingAs($ustadz, 'sanctum')
            ->postJson('/api/admin/santri/import', [
                'file' => $this->buatFileCsv($csv),
            ]);

        $response->assertForbidden();
        $this->assertSame(0, Santri::count());
    }

    public function test_import_dengan_kelas_id_dan_kamar_id_kosong_tetap_berhasil(): void
    {
        $admin = User::factory()->admin()->create();

        // kelas_id & kamar_id sengaja dikosongkan (nullable) di CSV.
        $csv = "nis,nama,jenis_kelamin,tanggal_lahir,alamat,kelas_id,kamar_id,tanggal_masuk\n"
            . "2026100,Ahmad Fauzi,L,2012-05-10,Jl. Contoh,,,2026-07-01\n";

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/santri/import', [
                'file' => $this->buatFileCsv($csv),
            ]);

        $response->assertCreated()->assertJson(['total_berhasil' => 1]);

        $santri = Santri::where('nis', '2026100')->first();
        $this->assertNotNull($santri);
        $this->assertNull($santri->kelas_id);
        $this->assertNull($santri->kamar_id);
    }
}
