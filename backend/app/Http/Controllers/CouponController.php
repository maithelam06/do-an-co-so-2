<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    // ADMIN: danh sách mã
    public function index()
    {
        $coupons = Coupon::with(['products:id,name'])
            ->orderByDesc('id')
            ->get();

        return response()->json($coupons);
    }

    // ADMIN: tạo mã
    public function store(Request $request)
    {
        $data = $request->validate([
            'code'        => 'required|string|unique:coupons,code',
            'discount'    => 'required|integer|min:1',
            'type'        => 'required|in:percent,fixed',
            'start_date'  => 'nullable|date',
            'expires_at'  => 'required|date',
            'status'      => 'required|in:active,inactive',
            'description' => 'nullable|string',
            'product_ids'   => 'array',
            'product_ids.*' => 'integer|exists:products,id',
        ]);

        $productIds = $data['product_ids'] ?? [];
        unset($data['product_ids']);

        $coupon = Coupon::create($data);

        if (!empty($productIds)) {
            $coupon->products()->sync($productIds);
        }

        $coupon->load('products:id,name');

        return response()->json($coupon, 201);
    }

    // ADMIN: cập nhật mã
    public function update(Request $request, Coupon $coupon)
    {
        $data = $request->validate([
            'code'        => 'required|string|unique:coupons,code,' . $coupon->id,
            'discount'    => 'required|integer|min:1',
            'type'        => 'required|in:percent,fixed',
            'start_date'  => 'nullable|date',
            'expires_at'  => 'required|date',
            'status'      => 'required|in:active,inactive',
            'description' => 'nullable|string',
            'product_ids'   => 'array',
            'product_ids.*' => 'integer|exists:products,id',
        ]);

        $productIds = $data['product_ids'] ?? [];
        unset($data['product_ids']);

        $coupon->update($data);
        $coupon->products()->sync($productIds);

        $coupon->load('products:id,name');

        return response()->json($coupon);
    }

    // ADMIN: xóa mã
    public function destroy(Coupon $coupon)
    {
        $coupon->delete();
        return response()->json(['message' => 'deleted']);
    }

    // USER: API dùng để nhập mã ở trang thanh toán
    public function apply(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $coupon = Coupon::where('code', $request->code)
            ->where('status', 'active')
            ->first();

        if (!$coupon) {
            return response()->json(['error' => 'Mã giảm giá không tồn tại'], 400);
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            return response()->json(['error' => 'Mã giảm giá đã hết hạn'], 400);
        }

        $productIds = $coupon->products()->pluck('products.id')->toArray();

        return response()->json([
            'code'        => $coupon->code,
            'discount'    => $coupon->discount,
            'type'        => $coupon->type, // percent | fixed
            'product_ids' => $productIds,   //  áp dụng cho tất cả sản phẩm
        ]);
    }
}
