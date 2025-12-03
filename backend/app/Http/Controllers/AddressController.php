<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    // Lấy danh sách địa chỉ của user
    public function index(Request $request)
    {
        $addresses = $request->user()->addresses()->get();
        return response()->json($addresses, 200);
    }

    public function show(Request $request, $id)
    {
        $address = Address::findOrFail($id);

        // Kiểm tra quyền
        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($address, 200);
    }
    // Thêm địa chỉ mới
    public function store(Request $request)
    {
        $validated = $request->validate([
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|regex:/^[0-9]{10,11}$/',
            'address_detail' => 'required|string',
            'province' => 'required|string',
            'district' => 'required|string',
            'ward' => 'required|string',
            'is_default' => 'boolean'
        ]);

        $validated['user_id'] = $request->user()->id;

        // Nếu đặt mặc định, bỏ mặc định các địa chỉ khác
        if ($validated['is_default'] ?? false) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        $address = Address::create($validated);

        return response()->json($address, 201);
    }

    // Cập nhật địa chỉ
    public function update(Request $request, $id)
    {
        $address = Address::findOrFail($id);

        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'recipient_name' => 'string|max:255',
            'recipient_phone' => 'string|regex:/^[0-9]{10,11}$/',
            'address_detail' => 'string',
            'province' => 'string',
            'district' => 'string',
            'ward' => 'string',
            'is_default' => 'boolean'
        ]);

        $address->update($validated);

        return response()->json($address, 200);
    }

    // Xóa địa chỉ
    public function destroy(Request $request, $id)
    {
        $address = Address::findOrFail($id);

        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $address->delete();

        return response()->json(['message' => 'Xóa thành công'], 200);
    }

    // Đặt địa chỉ mặc định
    public function setDefault(Request $request, $id)
    {
        $address = Address::findOrFail($id);

        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Bỏ mặc định các địa chỉ khác
        $request->user()->addresses()->update(['is_default' => false]);

        // Đặt mặc định cho địa chỉ này
        $address->update(['is_default' => true]);

        return response()->json($address, 200);
    }

    // Lấy địa chỉ mặc định của user
    public function getDefault(Request $request)
    {
        $address = $request->user()->addresses()->where('is_default', true)->first();

        if (!$address) {
            return response()->json(['message' => 'Không có địa chỉ mặc định'], 404);
        }

        return response()->json($address, 200);
    }
}
