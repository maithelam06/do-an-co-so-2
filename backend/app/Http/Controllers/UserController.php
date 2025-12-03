<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function profile(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'avatar' => $user->avatar,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $messages = [
            'name.required'  => 'Tên là bắt buộc.',
            'name.string'    => 'Tên phải là chuỗi.',
            'name.max'       => 'Tên không được quá 255 ký tự.',
            'phone.regex'    => 'Số điện thoại không hợp lệ. Chỉ được nhập số, bắt đầu bằng 0 và 10–11 chữ số.',
            'avatar.image'   => 'Avatar phải là file ảnh.',
        ];

        try {
            $validatedData = $request->validate([
                'name'  => 'required|string|max:255',
                'phone' => ['nullable', 'string', 'regex:/^0\d{9,10}$/'],
                'avatar' => 'nullable|image|max:2048',
            ], $messages);

            $user->name  = $validatedData['name'];
            $user->phone = $validatedData['phone'] ?? $user->phone;

            if ($request->hasFile('avatar')) {
                // Xóa avatar cũ
                if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                    Storage::disk('public')->delete($user->avatar);
                }

                // Lưu avatar mới
                $path = $request->file('avatar')->store('avatars', 'public');
                $user->avatar = $path;
            }

            $user->save();

            return response()->json([
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'phone'  => $user->phone,
                'avatar' => $user->avatar,
                'role'   => $user->role,
            ]);
        } catch (ValidationException $e) {
            // Trả JSON lỗi validate
            return response()->json([
                'message' => 'Dữ liệu không hợp lệ',
                'errors'  => $e->errors()
            ], 422);
        }
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mật khẩu hiện tại không đúng'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Đổi mật khẩu thành công!']);
    }
}
