<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mekanisme "ustadz yang ditunjuk Admin" untuk Penanggung Jawab Perizinan & Petugas Keuangan
        Schema::create('penugasan_ustadz', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ustadz_id')->constrained('users')->cascadeOnDelete();
            $table->enum('jenis_tugas', ['perizinan', 'keuangan']);
            $table->foreignId('ditunjuk_oleh')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penugasan_ustadz');
    }
};
