<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
             $table->id();
        $table->unsignedBigInteger('user_id')->nullable(); // nếu có đăng nhập
        $table->string('full_name');
        $table->string('phone');
        $table->string('email')->nullable();
        $table->string('province')->nullable();
        $table->string('district')->nullable();
        $table->string('ward')->nullable();
        $table->string('address');
        $table->text('note')->nullable();

        $table->string('payment_method');  // cod | bank
        $table->string('payment_channel')->nullable(); // vnpay | momo | null

        $table->decimal('total_amount', 15, 2)->default(0);
        $table->string('status')->default('pending'); // pending, processing, completed, cancelled

        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
