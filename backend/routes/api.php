<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\ProductController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Các route này dành cho API (frontend JS gọi qua fetch)
| http://localhost:8000/api/...
|--------------------------------------------------------------------------
*/

// 🔐 Auth
Route::post('/register', [RegisterController::class, 'store']);
Route::post('/login', [LoginController::class, 'login']);

// 🛒 Products
Route::get('/products', [ProductController::class, 'index']);          // Lấy tất cả (có thể lọc theo ?category=)
Route::get('/products/active', [ProductController::class, 'active']);  // Lấy sản phẩm đang bật (status = 1)
Route::post('/products', [ProductController::class, 'store']);         // Thêm sản phẩm
Route::post('/products/{id}', [ProductController::class, 'update']);   // Laravel dùng POST + _method=PUT
Route::delete('/products/{id}', [ProductController::class, 'destroy']); // Xóa sản phẩm
Route::patch('/products/{id}/toggle', [ProductController::class, 'toggle']); // Bật / Tắt sản phẩm
Route::get('/products/{id}', [ProductController::class, 'show']);
