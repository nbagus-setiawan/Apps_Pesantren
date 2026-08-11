<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pivot user (role=wali_santri) <-> santri, many-to-many (ayah & ibu bisa keduanya jadi wali)
        Schema::create('wali_santri', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('santri_id')->constrained('santri')->cascadeOnDelete();
            $table->enum('hubungan', ['ayah', 'ibu', 'wali']);
            $table->timestamps();

            $table->unique(['user_id', 'santri_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wali_santri');
    }
};
