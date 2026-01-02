<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class InvoiceOrder extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    protected $table      = 'invoice_orders';
    protected $primaryKey = 'invoice_order_id';

    protected $fillable = [
        'invoice_order_id',
        'invoice_id',
        'order_id',
        'product_id',
        'total',
        'sub_total',
        'product_code',
        'product_title',
        'product_price',
        'product_color',
        'product_ram',
        'quantity',
        'discount',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id', 'invoice_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
