<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class Order extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    public $timestamps = true;
    protected $dates = ['created_at'];

    protected $table = 'orders';
    protected $primaryKey = 'order_id';

    protected $fillable = [
        'customer_id',
        'user_id',
        'sub_total',
        'discount',
        'total',
        'total_payment',
        'is_paid',
        'payment_status',
        'md5_hash',
        'currency',
        'payment_method',
        'order_id',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'order_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function images()
    {
        return $this->hasManyThrough(ProductImage::class, OrderItem::class, 'order_id', 'product_id');
    }

    public function khqr()
    {
        return $this->hasOne(KHQR::class, 'order_id', 'order_id');
    }
    
    public function invoice()
    {
        return $this->hasOne(Invoice::class, 'order_id', 'order_id');
    }
}
