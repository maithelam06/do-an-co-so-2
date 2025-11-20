<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
            'status'          => 'pending',
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
                // log cảnh báo để debug nếu cần
                \Log::warning('ORDER_STORE_PRODUCT_NOT_FOUND', [
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
