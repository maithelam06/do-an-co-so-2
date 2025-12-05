<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Mail;

class ForgotPasswordController extends Controller
{
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Tìm user theo email
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'status'  => 'fail',
                'message' => 'Không tìm thấy tài khoản với email này.',
            ], 404);
        }

        // Tạo token reset mật khẩu (lưu vào bảng password_reset_tokens)
        $token = Password::createToken($user);

        // Gửi mail kèm link frontend
        Mail::to($user->email)->send(new ResetPasswordMail($user, $token));

        return response()->json([
            'status'  => 'success',
            'message' => 'Đã gửi link đặt lại mật khẩu tới email của bạn.',
        ]);
    }
}
