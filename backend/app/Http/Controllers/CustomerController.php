<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Danh sách khách hàng + thống kê
     * Trả về: id, name, email, phone, status, total_orders, total_spent
     */
    public function index()
    {
        // Lấy tất cả user, có thêm thống kê đơn hàng
        $customers = User::query()
            ->withCount('orders')                              // orders_count
            ->withSum('orders as total_spent', 'total_amount') // total_spent
            ->orderByDesc('id')
            ->get()
            ->map(function ($user) {
                return [
                    'id'            => $user->id,
                    'code'          => 'KH' . $user->id,               // mã KH hiển thị KH1, KH2...
                    'full_name'     => $user->name,                    // FE dùng full_name / name
                    'name'          => $user->name,
                    'email'         => $user->email,
                    'phone'         => $user->phone,
                    'status'        => $user->status ?? 'active',
                    'total_orders'  => $user->orders_count ?? 0,
                    'total_spent'   => $user->total_spent ?? 0,
                ];
            });

        return response()->json($customers);
    }

    /**
     * Cập nhật trạng thái khách hàng: active | blocked
     */
public function updateStatus(Request $request, $id)
{
    $request->validate([
        'status' => 'required|in:active,blocked',
    ]);

    $customer = User::where('role', 'user')->findOrFail($id);

    // cập nhật trạng thái
    $customer->status = $request->status;
    $customer->save();

    // Nếu khóa → xoá tất cả token → user bị đá ra khỏi hệ thống
    if ($request->status === 'blocked' && method_exists($customer, 'tokens')) {
        $customer->tokens()->delete();
    }

    return response()->json([
        'id'           => $customer->id,
        'code'         => 'KH' . $customer->id,
        'full_name'    => $customer->name,
        'email'        => $customer->email,
        'phone'        => $customer->phone,
        'total_orders' => $customer->orders()->count(),
        'total_spent'  => $customer->orders()->sum('total_amount'),
        'status'       => $customer->status,
    ]);
}
}