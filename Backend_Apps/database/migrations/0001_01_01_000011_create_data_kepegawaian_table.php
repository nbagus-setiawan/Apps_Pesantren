<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_kepegawaian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('nip_nuptk')->nullable();
            $table->text('alamat')->nullable();
            $table->string('pendidikan_terakhir')->nullable();
            $table->date('tanggal_mulai_tugas');
            $table->enum('status_kepegawaian', ['tetap', 'honorer', 'magang']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_kepegawaian');
    }
};
