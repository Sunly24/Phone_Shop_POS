<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KHQR extends Model
{
    protected $fillable = [
        'bill_number', 'payload', 'md5', 'qr_url', 'amount', 'currency', 'status', 'order_id', 'transaction_id'
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }
}