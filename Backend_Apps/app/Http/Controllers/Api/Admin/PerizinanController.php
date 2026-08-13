<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Perizinan;
use Illuminate\Http\Request;

/**
 * Monitoring (read-only) seluruh riwayat izin santri untuk Admin.
 *
 * PRD v1.5 §4.1: "Lihat rekap seluruh riwayat izin per santri (read-only,
 * monitoring)". Approve/reject TIDAK dilakukan di sini — itu wewenang
 * Ustadz yang ditunjuk sebagai Penanggung Jawab Perizinan, lewat
 * App\Http\Controllers\Api\Ustadz\PerizinanController::proses().
 */
class PerizinanController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Perizinan::with(['santri', 'diajukanOleh'])
                ->when($request->status, fn ($q) => $q->where('status', $request->status))
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }
}