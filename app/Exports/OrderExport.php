<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class OrderExport implements FromCollection, WithHeadings, WithMapping
{
    protected $orders;

    public function __construct($orders)
    {
        $this->orders = $orders;
    }

    public function collection()
    {
        return $this->orders;
    }
    
    public function headings(): array
    {
        return [
            'ID',
            'Customer',
            'Items',
            'Subtotal',
            'Discount',
            'Total',
            'Status',
            'Date'
        ];
    }
    
    public function map($order): array
    {
        return [
            'id' => $order['id'],
            'customer' => $order['customer'],
            'items' => $order['items'],
            'subtotal' => $order['subtotal'],
            'discount' => $order['discount'],
            'total' => $order['total'],
            'status' => $order['status'],
            'date' => $order['date'],
        ];
    }
}
