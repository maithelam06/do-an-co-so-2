<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Mail\ActivationMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RegisterController extends Controller
{
    public function store(RegisterRequest $request)
    {
        // Tạo token kích hoạt
        $activationToken = Str::random(64);

        $user = User::create([
            'name'             => $request->name,
            'email'            => $request->email,
            'password'         => Hash::make($request->password),
            'status'           => 'inactive',       // chưa kích hoạt
            'activation_token' => $activationToken, // token kích hoạt
            'role'             => 'user',
        ]);

        // Gửi mail kích hoạt
        Mail::to($user->email)->send(new ActivationMail($user));

        return response()->json([
            'status'  => 'success',
            'message' => 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.',
        ], 201);
    }
    public function activate($token)
{
    $user = User::where('activation_token', $token)->first();

    // Lỗi: Token sai hoặc hết hạn
    if (!$user) {
        return redirect('http://127.0.0.1:5500/frontend/index.html?activated=0');
    }

    // Cập nhật trạng thái
    $user->update([
        'status'            => 'active',
        'activation_token'  => null,
        'email_verified_at' => now(),
    ]);

    // Thành công
    return redirect('http://127.0.0.1:5500/frontend/index.html?activated=1');
}
}
