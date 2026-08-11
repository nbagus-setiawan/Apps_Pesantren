<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TagihanResource;
use App\Models\Tagihan;
use Illuminate\Http\Request;

class TagihanController extends Controller
{
    public function index(Request $request)
    {
        return TagihanResource::collection(
            Tagihan::with(['santri', 'jenisTagihan', 'pembayaran'])
                ->when($request->status, fn ($q) => $q->where('status', $request->status))
                ->when($request->santri_id, fn ($q) => $q->where('santri_id', $request->santri_id))
                ->when($request->periode, fn ($q) => $q->where('periode', $request->periode))
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }
}
