<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SantriResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nis' => $this->nis,
            'nama' => $this->nama,
            'jenis_kelamin' => $this->jenis_kelamin,
            'tanggal_lahir' => $this->tanggal_lahir?->format('Y-m-d'),
            'alamat' => $this->alamat,
            'tanggal_masuk' => $this->tanggal_masuk?->format('Y-m-d'),
            'status' => $this->status,
            'kelas' => $this->whenLoaded('kelas', fn () => [
                'id' => $this->kelas->id,
                'nama' => $this->kelas->nama,
            ]),
            'kamar' => $this->whenLoaded('kamar', fn () => [
                'id' => $this->kamar->id,
                'nama' => $this->kamar->nama,
            ]),
            'wali' => $this->whenLoaded('wali', fn () => $this->wali->map(fn ($w) => [
                'id' => $w->id,
                'nama' => $w->name,
                'hubungan' => $w->pivot->hubungan,
            ])),
        ];
    }
}