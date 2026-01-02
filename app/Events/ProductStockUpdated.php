<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class ProductStockUpdated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public $productId;
    public $newStock;

    public function __construct($productId, $newStock)
    {
        $this->productId = $productId;
        $this->newStock = $newStock;
    }

    public function broadcastOn()
    {
        return new Channel('products');
    }

    public function broadcastAs()
    {
        return 'stock.updated';
    }

    public function broadcastWith()
    {
        return [
            'productId' => $this->productId,
            'newStock' => $this->newStock,
        ];
    }
}