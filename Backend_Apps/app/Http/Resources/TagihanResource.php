<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TagihanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'periode' => $this->periode,
            'nominal' => $this->nominal,
            'jatuh_tempo' => $this->jatuh_tempo?->format('Y-m-d'),
            'status' => $this->status,
            'santri' => $this->whenLoaded('santri', fn () => [
                'id' => $this->santri->id,
                'nama' => $this->santri->nama,
            ]),
            'jenis_tagihan' => $this->whenLoaded('jenisTagihan', fn () => $this->jenisTagihan->nama),
            'pembayaran' => $this->whenLoaded('pembayaran', fn () => $this->pembayaran->map(fn ($p) => [
                'id' => $p->id,
                'jumlah_bayar' => $p->jumlah_bayar,
                'status' => $p->status,
                'tanggal_bayar' => $p->tanggal_bayar?->format('Y-m-d'),
            ])),
        ];
    }
}
