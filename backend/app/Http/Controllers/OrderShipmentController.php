<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderShipment;
use Illuminate\Http\Request;

class OrderShipmentController extends Controller
{
    // Lấy danh sách trạng thái của đơn
    public function index(Request $request, $orderId)
    {
        $user = $request->user(); // lấy user đang đăng nhập

        // Kiểm tra đơn hàng có thuộc user này không
        $order = Order::where('id', $orderId)
                      ->where('user_id', $user->id)
                      ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Lấy tất cả trạng thái giao hàng của đơn
        $shipments = OrderShipment::where('order_id', $orderId)
                                  ->orderBy('created_at', 'asc')
                                  ->get();

        return response()->json($shipments);
    }
}
