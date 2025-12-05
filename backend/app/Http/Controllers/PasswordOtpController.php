<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\PasswordChangedMail;

class PasswordOtpController extends Controller
{
    // Gửi OTP về email
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Kiểm tra user tồn tại
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'status'  => 'fail',
                'message' => 'Không tìm thấy tài khoản với email này.',
            ], 404);
        }

        // Tạo OTP 6 số
        $otp = (string) random_int(100000, 999999);

        // Lưu / cập nhật OTP
        PasswordResetOtp::updateOrCreate(
            ['email' => $user->email],
            [
                'otp'        => $otp,
                'expires_at' => now()->addMinutes(10),
            ]
        );

        // Gửi mail OTP (dùng raw cho nhanh)
        Mail::raw(
            "Mã OTP đặt lại mật khẩu TechStore của bạn là: {$otp}\n\nMã có hiệu lực trong 10 phút.",
            function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Mã OTP đặt lại mật khẩu - TechStore');
            }
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Đã gửi OTP đến email của bạn. Mã có hiệu lực trong 10 phút.',
        ]);
    }

    // Xác thực OTP
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|digits:6',
        ]);

        $record = PasswordResetOtp::where('email', $request->email)
            ->where('otp', $request->otp)
            ->first();

        if (!$record) {
            return response()->json([
                'status'  => 'fail',
                'message' => 'Mã OTP không đúng.',
            ], 400);
        }

        if ($record->expires_at->isPast()) {
            return response()->json([
                'status'  => 'fail',
                'message' => 'Mã OTP đã hết hạn.',
            ], 400);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Xác thực OTP thành công.',
        ]);
    }

    // Đặt lại mật khẩu
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'otp'                   => 'required|digits:6',
            'password'              => 'required|min:6|confirmed',
        ]);

        // Kiểm tra OTP
        $record = PasswordResetOtp::where('email', $request->email)
            ->where('otp', $request->otp)
            ->first();

        if (!$record) {
            return response()->json([
                'status'  => 'fail',
                'message' => 'Mã OTP không đúng.',
            ], 400);
        }

        if ($record->expires_at->isPast()) {
            return response()->json([
                'status'  => 'fail',
                'message' => 'Mã OTP đã hết hạn.',
            ], 400);
        }

        // Cập nhật mật khẩu user
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'status'  => 'fail',
                'message' => 'Không tìm thấy tài khoản.',
            ], 404);
        }

        //cập nh mạt khẩu mới
        if(Hash::check($request->password, $user->password)) {
            return response()->json([
                'status'  => 'fail',
                'message' => 'Mật khẩu mới không được trùng với mật khẩu cũ.',
            ],400);
        }
        
        $user->password = Hash::make($request->password);
        $user->save();

        // Xóa OTP sau khi dùng
        PasswordResetOtp::where('email', $request->email)->delete();
        Mail::to($user->email)->send(new PasswordChangedMail());

        return response()->json([
            'status'  => 'success',
            'message' => 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
        ]);
       
    }
}
