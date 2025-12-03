<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    protected $fillable = [
        'user_id',
        'recipient_name',
        'recipient_phone',
        'address_detail',
        'province',
        'district',
        'ward',
        'is_default'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}