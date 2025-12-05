<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();          // Mã: GIAM10, GIAM20K...
            $table->integer('discount');               // Giá trị giảm
            $table->enum('type', ['percent', 'fixed']); // percent: % , fixed: VND
            $table->date('expires_at');                // Ngày hết hạn
            $table->enum('status', ['active','inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
