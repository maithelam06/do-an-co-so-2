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
        Schema::table('products', function (Blueprint $table) {
            // 1. Thêm cột category_id
            $table->foreignId('category_id')
                  ->nullable() // Cho phép NULL nếu sản phẩm chưa có danh mục
                  ->constrained('categories') // Tham chiếu đến khóa chính (id) của bảng 'categories'
                  ->onDelete('restrict') // KHÔNG cho phép xóa danh mục nếu có sản phẩm liên quan
                  ->after('name'); // Đặt sau cột 'name' (tùy chọn vị trí)
            
            // Nếu bạn đang có cột 'category' cũ (string) mà không dùng nữa, 
            // bạn có thể xóa nó tại đây:
            // $table->dropColumn('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
       Schema::table('products', function (Blueprint $table) {
        // BƯỚC 1: Xóa ràng buộc khóa ngoại trước.
        // Tên ràng buộc mặc định: products_category_id_foreign
        $table->dropForeign(['category_id']); 
        
        // HOẶC (cách hiện đại hơn trong Laravel)
        // $table->dropConstrainedForeignId('category_id'); 
        
        // BƯỚC 2: Sau đó, xóa cột.
        $table->dropColumn('category_id');
    });
    }
};