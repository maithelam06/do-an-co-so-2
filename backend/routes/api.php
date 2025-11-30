<?php

use App\Http\Controllers\CartController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\VnpayController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CategoryController;

use App\Http\Controllers\VnpayReportController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\ChatController;

use App\Http\Controllers\OrderShipmentController;
use App\Http\Controllers\ReviewController;
use Illuminate\Http\Request;


// 🔐 Auth
Route::post('/register', [RegisterController::class, 'store']);
Route::post('/login', [LoginController::class, 'login']);
// Khách hàng
Route::get('/customers', [CustomerController::class, 'index']);
Route::patch('/customers/{id}/status', [CustomerController::class, 'updateStatus']);

// 🛒 Products
Route::get('/products', [ProductController::class, 'index']);          // Lấy tất cả (có thể lọc theo ?category=)
Route::get('/products/active', [ProductController::class, 'active']);  // Lấy sản phẩm đang bật (status = 1)
Route::post('/products', [ProductController::class, 'store']);         // Thêm sản phẩm
Route::post('/products/{id}', [ProductController::class, 'update']);   // Laravel dùng POST + _method=PUT
Route::delete('/products/{id}', [ProductController::class, 'destroy']); // Xóa sản phẩm
Route::patch('/products/{id}/toggle', [ProductController::class, 'toggle']); // Bật / Tắt sản phẩm
Route::get('/products/{id}', [ProductController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/cart/add/{productId}', [CartController::class, 'addToCart']);
    Route::get('/cart', [CartController::class, 'viewCart']);
    Route::delete('/cart/remove/{itemId}', [CartController::class, 'removeItem']);
    Route::get('cart/count', [CartController::class, 'count']);
    Route::put('/cart/update/{itemId}', [CartController::class, 'updateQuantity']);
    Route::delete('/cart/clear', [CartController::class, 'clearCart']);
    Route::post('/cart/remove-multiple', [CartController::class, 'removeMultiple']);

    Route::post('/orders', [OrderController::class, 'store']);
});

// Đơn hàng cho admin (public API – ông đang dùng thẳng trên FE admin)
Route::get('/orders', [OrderController::class, 'index']);
Route::get('/orders/{id}', [OrderController::class, 'show']);

// Cập nhật trạng thái thanh toán (nếu cần)
Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
// Cập nhật TRẠNG THÁI GIAO HÀNG (dùng cho nút "Cập nhật giao hàng")
Route::patch('/orders/{id}/shipping-status', [OrderController::class, 'updateShippingStatus']);
Route::delete('/orders/{id}', [OrderController::class, 'destroy']); //xóa

// USER
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/my-orders', [OrderController::class, 'myOrders']);
    Route::post('/orders/{orderId}/cancel', [OrderController::class, 'cancelOrder']);
});





Route::get('/customers', [CustomerController::class, 'index']);
Route::patch('/customers/{id}/status', [CustomerController::class, 'updateStatus']);


Route::post('/vnpay/create', [VnpayController::class, 'createPayment']);
Route::get('/vnpay/return', [VnpayController::class, 'return']);
Route::match(['GET','POST'], '/vnpay/ipn', [VnpayController::class, 'ipnHandler']);


//thống kê tổng quan
Route::prefix('admin')->group(function () {
    Route::get('/vnpay/summary', [VnpayReportController::class, 'summary']);
    Route::get('/vnpay/orders',  [VnpayReportController::class, 'orders']);

    Route::get('/cod/summary',   [VnpayReportController::class, 'codSummary']);
    Route::get('/cod/orders',    [VnpayReportController::class, 'codOrders']);
});

// thống kê side band
Route::prefix('admin/stats')->group(function () {
    Route::get('/overview',        [StatsController::class, 'overview']);
    Route::get('/revenue-by-date', [StatsController::class, 'revenueByDate']);
    Route::get('/payment-method',  [StatsController::class, 'paymentMethod']);
    Route::get('/top-products',    [StatsController::class, 'topProducts']);
    Route::get('/top-customers',   [StatsController::class, 'topCustomers']);
});


// chat
Route::prefix('chat')->group(function () {
    Route::get('/users', [ChatController::class, 'users']); 
    Route::get('/messages', [ChatController::class, 'messages']); 
    Route::post('/send', [ChatController::class, 'send']);           // admin → user
    Route::post('/user-send', [ChatController::class, 'userSend']); // user → admin
    Route::post('/create-room', [ChatController::class, 'createRoom']);
});



Route::get('/categories', [CategoryController::class, 'index']);


Route::middleware('auth:sanctum')->get('/orders/{orderId}/shipments', [OrderShipmentController::class, 'index']);