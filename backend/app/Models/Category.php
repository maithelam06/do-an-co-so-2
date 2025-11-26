<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'slug'];

    // Mối quan hệ: Category có nhiều Product
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}