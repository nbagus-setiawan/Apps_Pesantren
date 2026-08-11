<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'email_verified_at' => now(),
            // Password plain — model User meng-hash otomatis lewat cast
            // 'password' => 'hashed'. Jangan panggil Hash::make()/bcrypt()
            // di sini, karena akan menyebabkan double hashing.
            'password' => 'password',
            'role' => 'wali_santri',
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => ['role' => 'admin']);
    }

    public function ustadz(): static
    {
        return $this->state(fn (array $attributes) => ['role' => 'ustadz']);
    }

    public function waliSantri(): static
    {
        return $this->state(fn (array $attributes) => ['role' => 'wali_santri']);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => ['email_verified_at' => null]);
    }
}