<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderShipment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    // API cho admin lấy danh sách
    public function index()
    {
        $orders = Order::orderByDesc('id')->get();
        return response()->json($orders);
    }

    // API tạo đơn từ FE
    public function store(Request $request)
    {
        $items          = $request->input('items', []);
        $customer       = $request->input('customer', []);
        $paymentMethod  = $request->input('payment_method');
        $paymentChannel = $request->input('payment_channel');
        $totalPrice     = $request->input('total_price', 0);

        if (empty($items)) {
            return response()->json(['message' => 'Không có sản phẩm'], 422);
        }

        if (!$paymentMethod) {
            return response()->json(['message' => 'Thiếu phương thức thanh toán'], 422);
        }

        $userId = optional($request->user())->id;

        return DB::transaction(function () use (
            $items,
            $customer,
            $paymentMethod,
            $paymentChannel,
            $totalPrice,
            $userId
        ) {
            $order = Order::create([
                'user_id'         => $userId,
                'full_name'       => $customer['fullName'] ?? '',
                'phone'           => $customer['phone'] ?? '',
                'email'           => $customer['email'] ?? null,
                'province'        => $customer['provinceName'] ?? null,
                'district'        => $customer['districtName'] ?? null,
                'ward'            => $customer['wardName'] ?? null,
                'address'         => $customer['address'] ?? '',
                'note'            => $customer['note'] ?? null,
                'payment_method'  => $paymentMethod,   // cod | bank
                'payment_channel' => $paymentChannel,  // vnpay | null
                'total_amount'    => $totalPrice,
                'status'          => 'pending',
                'shipping_status' => 'pending',
            ]);

            foreach ($items as $item) {
                $productId = $item['product_id']
                    ?? $item['productId']
                    ?? $item['id']
                    ?? null;

                $product = $productId ? Product::find($productId) : null;

                $nameFromItem  = $item['product_name'] ?? $item['name'] ?? null;
                $priceFromItem = $item['price'] ?? null;
                $qty           = $item['quantity'] ?? 1;

                if ($product) {
                    $name  = $product->name;
                    $price = $product->price;
                } else {
                    Log::warning('ORDER_STORE_PRODUCT_NOT_FOUND', [
                        'product_id' => $productId,
                        'item'       => $item,
                    ]);

                    $name  = $nameFromItem  ?? 'Sản phẩm không xác định';
                    $price = $priceFromItem ?? 0;
                }

                $subtotal = $price * $qty;

                OrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $productId,
                    'product_name' => $name,
                    'price'        => $price,
                    'quantity'     => $qty,
                    'subtotal'     => $subtotal,
                ]);
            }

            OrderShipment::create([
                'order_id'    => $order->id,
                'status'      => $order->shipping_status,
                'status_note' => "Admin cập nhật trạng thái",
            ]);

            return response()->json([
                'message'  => 'Tạo đơn hàng thành công',
                'order_id' => $order->id,
            ], 201);
        });
    }

    // Cập nhật trạng thái thanh toán + giao hàng (admin bấm)
    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $newStatus   = $request->input('status');          // optional
        $newShipping = $request->input('shipping_status'); // optional

        if (!is_null($newStatus)) {
            $order->status = $newStatus;
        }

        if (!is_null($newShipping)) {
            $order->shipping_status = $newShipping;
        }

        $shouldAutoRefund = false;

        // ĐƠN COD
        if ($order->payment_method === 'cod') {
            switch ($order->shipping_status) {
                case 'completed':
                    $order->status = 'completed';
                    break;
                case 'cancelled':
                    $order->status = 'cancelled';
                    break;
                default:
                    $order->status = 'pending';
                    break;
            }
        }

        // ĐƠN VNPAY
        if ($order->payment_method === 'bank' && $order->payment_channel === 'vnpay') {

            // Admin set giao hàng "Đã hủy" trong khi đơn đã completed => chờ hoàn
            if ($order->shipping_status === 'cancelled' && $order->status === 'completed') {
                $order->status = 'refund_pending';
            }

            // Nếu admin set status = cancelled -> shipping cũng cancelled
            if ($order->status === 'cancelled') {
                $order->shipping_status = 'cancelled';
            }

            if ($order->status === 'refund_pending') {
                $shouldAutoRefund = true;
            }
        }

        $order->save();

        OrderShipment::create([
            'order_id'    => $order->id,
            'status'      => $order->shipping_status,
            'status_note' => "Admin cập nhật trạng thái",
        ]);

        // AUTO REFUND nếu cần
        if ($shouldAutoRefund) {
            try {
                $vnpay = app(\App\Http\Controllers\VnpayController::class);

                $refundReq = new Request([
                    'order_id' => $order->id,
                ]);

                $refundRes = $vnpay->refund($refundReq);

                Log::info('AUTO_REFUND_FROM_UPDATE_STATUS', [
                    'order_id' => $order->id,
                    'result'   => method_exists($refundRes, 'getData')
                        ? $refundRes->getData(true)
                        : null,
                ]);
            } catch (\Throwable $e) {
                Log::error('AUTO_REFUND_ERROR_FROM_UPDATE_STATUS', [
                    'order_id' => $order->id,
                    'error'    => $e->getMessage(),
                ]);
            }

            $order->refresh();
        }

        return response()->json($order);
    }

    // Xóa đơn
    public function destroy($id)
    {
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        DB::transaction(function () use ($order) {
            $order->items()->delete();
            $order->delete();
        });

        return response()->json([
            'message' => 'Xóa đơn hàng thành công',
        ]);
    }

    // Chi tiết đơn cho admin
    public function show($id)
    {
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json([
            'order' => $order,
            'items' => $order->items,
        ]);
    }

    // Danh sách đơn của user
    public function myOrders(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $orders = Order::with('items.product')
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->get();

        return response()->json($orders);
    }

    // User tự hủy đơn
    public function cancelOrder(Request $request, $orderId)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $order = Order::where('id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($order->shipping_status !== 'pending') {
            return response()->json(['message' => 'Cannot cancel this order'], 400);
        }

        $order->shipping_status = 'cancelled';

        if (
            $order->payment_method === 'bank' &&
            $order->payment_channel === 'vnpay' &&
            $order->status === 'completed'
        ) {
            $order->status = 'refund_pending';
        } else {
            $order->status = 'cancelled';
        }

        $order->save();

        OrderShipment::create([
            'order_id'    => $order->id,
            'status'      => 'cancelled',
            'status_note' => 'Người dùng hủy đơn',
        ]);

        // AUTO REFUND khi user hủy đơn đã thanh toán VNPAY
        if ($order->status === 'refund_pending') {
            try {
                $vnpay = app(\App\Http\Controllers\VnpayController::class);

                $refundReq = new Request([
                    'order_id' => $order->id,
                ]);

                $refundRes = $vnpay->refund($refundReq);

                Log::info('AUTO_REFUND_FROM_CANCEL_ORDER', [
                    'order_id' => $order->id,
                    'result'   => method_exists($refundRes, 'getData')
                        ? $refundRes->getData(true)
                        : null,
                ]);
            } catch (\Throwable $e) {
                Log::error('AUTO_REFUND_ERROR_FROM_CANCEL_ORDER', [
                    'order_id' => $order->id,
                    'error'    => $e->getMessage(),
                ]);
            }

            $order->refresh();
        }

        return response()->json([
            'message' => 'Order cancelled successfully',
            'order'   => $order,
        ]);
    }

    // Admin tự xác nhận đã hoàn tiền VNPAY (duyệt thủ công)
    public function approveRefund(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        // Chỉ cho duyệt với đơn VNPAY đang chờ hoàn tiền
        if (
            $order->payment_method !== 'bank' ||
            $order->payment_channel !== 'vnpay'
        ) {
            return response()->json([
                'message' => 'Chỉ duyệt hoàn tiền cho đơn thanh toán qua VNPay',
            ], 400);
        }

        if ($order->status !== 'refund_pending') {
            return response()->json([
                'message' => 'Đơn này không ở trạng thái chờ hoàn tiền',
                'status'  => $order->status,
            ], 400);
        }

        // Đánh dấu đã hoàn tiền thủ công
        $order->status          = 'refunded';
        $order->shipping_status = 'cancelled'; // vẫn giữ là đã hủy giao hàng
        $order->save();

        // Lưu lịch sử shipment
        OrderShipment::create([
            'order_id'    => $order->id,
            'status'      => $order->shipping_status,
            'status_note' => 'Admin xác nhận đã hoàn tiền VNPay thủ công',
        ]);

        return response()->json([
            'message' => 'Đã xác nhận hoàn tiền VNPay',
            'order'   => $order,
        ]);
    }
}
