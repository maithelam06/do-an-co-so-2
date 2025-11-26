<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category_id',
        'price',
        'description',
        'image',
        'status',
    ];

    public function category()
    {
        // Liên kết với Model Category, sử dụng 'category_id' làm khóa ngoại
        return $this->belongsTo(Category::class, 'category_id');
    }
}
