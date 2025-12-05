<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Sai tài khoản / mật khẩu
        if (!Auth::attempt($credentials)) {
            return response()->json([
                'status'  => 'fail',
                'message' => 'Email hoặc mật khẩu không đúng'
            ], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        // Chặn nếu chưa kích hoạt
        if ($user->status === 'inactive') {
            Auth::logout();

            return response()->json([
                'status'  => 'fail',
                'message' => 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email!',
            ], 403);
        }

        // Chặn nếu bị khóa
        if ($user->status === 'blocked') {
            Auth::logout();

            return response()->json([
                'status'  => 'fail',
                'message' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
            ], 403);
        }

        // CHỈ CHO 1 THIẾT BỊ: xóa tất cả token cũ
        $user->tokens()->delete();

        // Tạo token mới
        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'status'  => 'success',
            'message' => 'Đăng nhập thành công',
            'token'   => $token,
            'role'    => $user->role,
            'user'    => [
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'avatar' => $user->avatar
                    ? asset('storage/' . $user->avatar)
                    : asset('frontend/img/avt.jpg'),
            ],
        ]);
    }
}
