<?php

use App\Http\Controllers\CartController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\VnpayController;
use App\Http\Controllers\CustomerController;

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



Route::get('/customers', [CustomerController::class, 'index']);
Route::patch('/customers/{id}/status', [CustomerController::class, 'updateStatus']);


Route::post('/vnpay/create', [VnpayController::class, 'createPayment']);
Route::get('/vnpay/return', [VnpayController::class, 'return'])->name('vnpay.return');

