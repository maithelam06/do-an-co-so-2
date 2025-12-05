<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'activation_token')) {
                $table->string('activation_token', 64)->nullable()->unique()->after('status');
            }

            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('inactive')->after('remember_token');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'activation_token')) {
                $table->dropColumn('activation_token');
            }
        });
    }
};
