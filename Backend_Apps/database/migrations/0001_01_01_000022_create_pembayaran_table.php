<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembayaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tagihan_id')->constrained('tagihan')->cascadeOnDelete();
            $table->foreignId('dibayar_oleh')->constrained('users')->cascadeOnDelete(); // wali
            $table->decimal('jumlah_bayar', 12, 2);
            $table->string('bukti_transfer'); // file path
            $table->date('tanggal_bayar');
            $table->enum('status', ['pending', 'diverifikasi', 'ditolak'])->default('pending');
            // petugas keuangan
            $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_petugas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembayaran');
    }
};
