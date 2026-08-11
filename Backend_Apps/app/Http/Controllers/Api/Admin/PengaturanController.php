<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pengaturan;
use Illuminate\Http\Request;

class PengaturanController extends Controller
{
    /**
     * Whitelist key pengaturan yang boleh diubah lewat endpoint ini.
     * Tanpa whitelist ini, request body apapun (mis. {"foo":"bar"})
     * akan tersimpan begitu saja ke tabel `pengaturan` — bukan hanya
     * bug data sampah, tapi juga membuat endpoint ini generic key-value
     * writer yang tidak seharusnya (privilege terlalu luas untuk Admin).
     */
    private const ALLOWED_KEYS = [
        'nama_pesantren',
        'ambang_batas_poin_pelanggaran',
        'qr_durasi_jam',
    ];

    public function index()
    {
        return response()->json(
            Pengaturan::all()->pluck('value', 'key')
        );
    }

    /**
     * Update banyak key sekaligus:
     * { "ambang_batas_poin_pelanggaran": "120", "qr_durasi_jam": "48" }
     *
     * PERBAIKAN dari versi sebelumnya:
     * 1. Rule `'*' => ['nullable','string']` BUKAN aturan wildcard yang valid
     *    untuk top-level request (wildcard hanya berlaku untuk key array,
     *    mis. 'items.*'). Akibatnya validasi ini praktis no-op.
     * 2. Hasil $request->validate() sebelumnya tidak dipakai sama sekali —
     *    kode lama langsung loop $request->all(), jadi field apapun yang
     *    dikirim client (termasuk yang tidak dimaksud jadi setting)
     *    tersimpan ke tabel pengaturan tanpa filter.
     *
     * Sekarang: validasi eksplisit per whitelist key + tipe data yang
     * jelas, dan hanya key dalam ALLOWED_KEYS yang diproses.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'nama_pesantren' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ambang_batas_poin_pelanggaran' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'qr_durasi_jam' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:168'],
        ]);

        foreach ($data as $key => $value) {
            if (! in_array($key, self::ALLOWED_KEYS, true)) {
                continue;
            }

            Pengaturan::set($key, (string) $value);
        }

        return response()->json(Pengaturan::all()->pluck('value', 'key'));
    }
}