<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class ProductNotification implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public $productId;
    public $action;
    public $productTitle;
    public $price;
    public $username;

    public function __construct($productId, $action, $productTitle, $price, $username)
    {
        $this->productId = $productId;
        $this->action = $action;
        $this->productTitle = $productTitle;
        $this->price = $price;
        $this->username = $username;
    }    public function broadcastOn()
    {
        return new Channel('products');
    }

    public function broadcastWith()
    {
        return [
            'productId' => $this->productId,
            'action' => $this->action,
            'productTitle' => $this->productTitle,
            'price' => $this->price,
            'username' => $this->username,
        ];
    }

    public function broadcastAs()
    {
        return 'product-changed';
    }
}
