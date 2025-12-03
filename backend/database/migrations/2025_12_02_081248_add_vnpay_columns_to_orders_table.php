<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('vnp_transaction_no')->nullable()->after('total_amount');
            $table->bigInteger('vnp_amount')->nullable()->after('vnp_transaction_no');      // VND
            $table->string('vnp_pay_date')->nullable()->after('vnp_amount');               // YmdHis
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['vnp_transaction_no', 'vnp_amount', 'vnp_pay_date']);
        });
    }
};
