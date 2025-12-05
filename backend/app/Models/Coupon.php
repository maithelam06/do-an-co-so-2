<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'discount',
        'type',
        'start_date',
        'expires_at',
        'status',
        'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'expires_at' => 'date',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'coupon_product');
    }
}
