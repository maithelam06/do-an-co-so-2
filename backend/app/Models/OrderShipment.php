<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderShipment extends Model
{
    protected $fillable = [
        'order_id',
        'tracking_number',
        'carrier_name',
        'status',
        'status_note'       
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
