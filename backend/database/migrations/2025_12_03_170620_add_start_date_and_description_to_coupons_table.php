<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            // thêm cột start_date (có thể null)
            $table->date('start_date')->nullable()->after('discount');

            // thêm cột description (ghi chú)
            $table->text('description')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'description']);
        });
    }
};
