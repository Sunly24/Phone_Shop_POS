<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class OrderItem extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    public $timestamps = true;
    protected $dates = ['created_at'];

    protected $table = 'order_items';
    protected $primaryKey = 'order_item_id';
    public $incrementing = true;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_code',
        'product_title',
        'product_price',
        'quantity', 
        'product_ram',  
        'product_color',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
    public function images()
    {
        return $this->hasMany(ProductImage::class, 'product_id', 'product_id');
    }
}
