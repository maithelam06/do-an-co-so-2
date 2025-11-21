<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id','full_name','phone','email',
        'province','district','ward','address','note',
        'payment_method','payment_channel','total_amount','status','shipping_status',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
