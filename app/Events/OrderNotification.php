<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderNotification implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $orderId;
    public $customerName;
    public $total;
    public $currency;
    public $username;
    public $action;
    public $productTitle;

    /**
     * Create a new event instance.
     */
    public function __construct($orderId, $customerName, $total, $currency, $username, $productTitle = null, $action = 'created')
    {
        $this->orderId = $orderId;
        $this->customerName = $customerName;
        $this->total = $total;
        $this->currency = $currency;
        $this->username = $username;
        $this->action = $action;
        $this->productTitle = $productTitle;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('orders'),
        ];
    }    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'orderId' => $this->orderId,
            'customerName' => $this->customerName,
            'total' => $this->total,
            'currency' => $this->currency,
            'username' => $this->username,
            'action' => $this->action,
            'productTitle' => $this->productTitle,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'order-notification';
    }
}
