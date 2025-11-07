<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(LoginRequest $request)
    {
        $credentials=$request->only('email','password');

        if(Auth::attempt($credentials))
        {
            $user=Auth::user();

            $token = $user->createToken('authToken')->plainTextToken;
        
            return response()->json([
                'status' => 'success',
                'message' => 'Đăng nhập thành công',
                'role' => $user->role,
                'name' => $user->name,
                'token' => $token
            ]);
        }

        return response()->json([
            'status' => 'fail',
            'message' => 'Email hoặc mật khẩu không đúng'
        ], 401);
    }
}