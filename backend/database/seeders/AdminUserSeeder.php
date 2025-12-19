<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');

        // Nếu chưa cấu hình admin thì bỏ qua
        if (!$email) {
            return;
        }

        User::firstOrCreate(
            ['email' => $email],
            [
                'name'     => env('ADMIN_NAME', 'Admin'),
                'password' => Hash::make(env('ADMIN_PASSWORD', '123456')),
                'role'     => 'admin',
                'status'   => 'active',
            ]
        );
    }
}
