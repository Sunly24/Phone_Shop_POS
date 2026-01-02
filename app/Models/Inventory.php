<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventories';

    protected $fillable = [
        'order_id',
        'product_id',
        'product_title',
        'product_price',
        'product_stock',
        'quantity_booked',
        'last_restocked_at',
        'last_updated_by',
    ];

    // Define the relationship with the Product model
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    // Helper to get the available stock
    public function getQuantityAvailableAttribute()
    {
        return $this->product_stock - $this->quantity_booked;
    }
}
