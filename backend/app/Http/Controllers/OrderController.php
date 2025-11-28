<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    // API cho admin lấy danh sách
    public function index()
    {
        // List đơn cho bảng admin
        $orders = Order::orderByDesc('id')->get();
        return response()->json($orders);
    }

    // API tạo đơn từ FE
    public function store(Request $request)
    {
        // dữ liệu FE gửi lên từ thanhtoan.js
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

        // Lấy id user đang đăng nhập (nếu có, dùng Sanctum)
        $userId = optional($request->user())->id;

        return DB::transaction(function () use (
            $items,
            $customer,
            $paymentMethod,
            $paymentChannel,
            $totalPrice,
            $userId
        ) {
            // tạo order
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
                'payment_channel' => $paymentChannel,  // vnpay | momo | null
                'total_amount'    => $totalPrice,
                'status'          => 'pending',        // trạng thái thanh toán
                'shipping_status' => 'pending',        // trạng thái giao hàng
            ]);

            // lưu từng sản phẩm
            foreach ($items as $item) {
                // FE gửi product_id, nếu không có thì fallback sang productId hoặc id
                $productId = $item['product_id']
                    ?? $item['productId']
                    ?? $item['id']
                    ?? null;

                $product = $productId ? Product::find($productId) : null;

                // Lấy name & price từ nhiều nguồn
                $nameFromItem  = $item['product_name'] ?? $item['name'] ?? null;
                $priceFromItem = $item['price'] ?? null;
                $qty           = $item['quantity'] ?? 1;

                if ($product) {
                    $name  = $product->name;
                    $price = $product->price;
                } else {
                    // Nếu không tìm được product vẫn tạo order_item
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

            return response()->json([
                'message'  => 'Tạo đơn hàng thành công',
                'order_id' => $order->id,
            ], 201);
        });
    }

    // Cập nhật trạng thái thanh toán + (optional) trạng thái giao hàng
    public function updateStatus(Request $request, $id)
{
    $order = Order::findOrFail($id);

    // Data từ FE gửi lên (có thể gửi 1 hoặc cả 2)
    $newStatus   = $request->input('status');           // pending | processing | completed | cancelled | refund_pending
    $newShipping = $request->input('shipping_status');  // pending | processing | completed | cancelled

    // 1. Cập nhật theo dữ liệu FE gửi lên
    if (!is_null($newStatus)) {
        $order->status = $newStatus;
    }

    if (!is_null($newShipping)) {
        $order->shipping_status = $newShipping;
    }

    // ===== A. ĐƠN COD =====
    if ($order->payment_method === 'cod') {

        switch ($order->shipping_status) {
            case 'completed':
                // ĐÃ GIAO -> thanh toán HOÀN THÀNH
                $order->status = 'completed';
                break;

            case 'cancelled':
                // HỦY GIAO -> thanh toán ĐÃ HỦY
                $order->status = 'cancelled';
                break;

            default:
                // pending / processing ... -> luôn là CHỜ XỬ LÝ
                $order->status = 'pending';
                break;
        }
    }

    // ===== B. ĐƠN CHUYỂN KHOẢN QUA VNPAY =====
    if ($order->payment_method === 'bank' && $order->payment_channel === 'vnpay') {

        // Nếu giao hàng bị HỦY => CHỜ HOÀN TIỀN
        if ($order->shipping_status === 'cancelled') {
            $order->status = 'refund_pending';   // trạng thái mới
        }

        // Nếu thanh toán đã bị admin set "cancelled" thì cho giao hàng = cancelled luôn
        if ($order->status === 'cancelled') {
            $order->shipping_status = 'cancelled';
        }
    }

    $order->save();

    return response()->json($order);
}

    // Cập nhật TRẠNG THÁI GIAO HÀNG (dùng cho nút trong admin)
    public function updateShippingStatus(Request $request, $id)
{
    $request->validate([
        'shipping_status' => 'required|in:pending,processing,completed,cancelled',
    ]);

    $order = Order::findOrFail($id);

    $order->shipping_status = $request->shipping_status;

    // ===== ĐƠN COD =====
    if ($order->payment_method === 'cod') {
        // Giao hàng hoàn thành -> thanh toán hoàn thành
        if ($order->shipping_status === 'completed') {
            $order->status = 'completed';
        }

        // Giao hàng hủy -> thanh toán hủy
        if ($order->shipping_status === 'cancelled') {
            $order->status = 'cancelled';
        }
    }

    // ===== ĐƠN CHUYỂN KHOẢN QUA VNPAY =====
    if ($order->payment_method === 'bank' && $order->payment_channel === 'vnpay') {
        // Nếu giao hàng bị HỦY -> đang chờ hoàn tiền
        if ($order->shipping_status === 'cancelled') {
            $order->status = 'refund_pending'; // trạng thái mới
        }
    }

    $order->save();

    return response()->json([
        'message' => 'Cập nhật trạng thái giao hàng thành công',
        'order'   => $order,
    ]);
}

    //xóa
    public function destroy($id)
{
    $order = Order::with('items')->find($id);

    if (!$order) {
        return response()->json(['message' => 'Order not found'], 404);
    }

    DB::transaction(function () use ($order) {
        // Xoá các order_item trước (nếu có ràng buộc FK)
        $order->items()->delete();
        $order->delete();
    });

    return response()->json([
        'message' => 'Xóa đơn hàng thành công',
    ]);
}


    // API chi tiết đơn cho admin
    public function show($id)
    {
        // Lấy order + items theo quan hệ
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Trả đúng format FE đang dùng: { order: {...}, items: [...] }
        return response()->json([
            'order' => $order,
            'items' => $order->items,
        ]);
    }
}
