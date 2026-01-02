<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BakongPaymentCompleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $status;
    public $bill_number;
    public $md5;
    public $amount;
    public $currency;
    public $transaction_id;
    public $order_id;

    public function __construct($khqr, $transactionId = null)
    {
        $this->status = $khqr->status;
        $this->bill_number = $khqr->bill_number;
        $this->md5 = $khqr->md5;
        $this->amount = $khqr->amount;
        $this->currency = $khqr->currency;
        $this->order_id = $khqr->order_id;
        $this->transaction_id = $transactionId;
        
        // Add logging for debugging
        \Illuminate\Support\Facades\Log::info("Broadcasting payment completed event for MD5: {$this->md5}, Bill: {$this->bill_number}");
    }

    public function broadcastOn()
    {
        return new Channel('bakong-payments');
    }

    public function broadcastAs()
    {
        return 'bakong.payment.completed';
    }
}