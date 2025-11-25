<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(LoginRequest $request)
    {
        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            //Chặn đăng nhập nếu bị khóa
            if ($user->status === 'blocked') {
                Auth::logout();

                return response()->json([
                    'status'  => 'fail',
                    'message' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
                ], 403);
            }

            // Tạo token nếu tài khoản active
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
                        : asset('storage/avatars/default.png'),
                ],
            ]);
        }


        return response()->json([
            'status'  => 'fail',
            'message' => 'Email hoặc mật khẩu không đúng'
        ], 401);
    }
}
