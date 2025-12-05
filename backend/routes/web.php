<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VnpayController;
use App\Http\Controllers\RegisterController;
// 🔐 Auth

Route::get('/vnpay-return', [VnpayController::class, 'return']);



Route::get('/activate-account/{token}', [RegisterController::class, 'activate'])
    ->name('activate.account');

