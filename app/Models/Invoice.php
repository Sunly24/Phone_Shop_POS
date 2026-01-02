<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class Invoice extends Model implements Auditable
{
    use HasFactory, AuditableTrait;

    protected $table = 'invoices';
    protected $primaryKey = 'invoice_id';

    protected $fillable = [
        'order_id',
        'customer_id',
        'total_amount',
        'sub_total',
        'is_paid',
        'currency',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function invoiceOrders()
    {
        return $this->hasMany(InvoiceOrder::class, 'invoice_id', 'invoice_id');
    }
}
