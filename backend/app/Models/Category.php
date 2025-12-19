<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'description', 'status'];

    protected $casts = [
        'status' => 'boolean',
    ];

    // Mối quan hệ: Category có nhiều Product
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    // Scope để lấy categories đang hoạt động
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}