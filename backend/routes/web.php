<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VnpayController;
// 🔐 Auth

Route::get('/vnpay-return', [VnpayController::class, 'return']);
