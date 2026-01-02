<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;
    // Removed SerializesModels trait to avoid database lookups

    // Store message data as array instead of model instance
    public $messageData;
    protected $sessionId;
    protected $sender;

    /**
     * Create a new event instance.
     * 
     * Instead of relying on the model instance (which can cause issues with queues),
     * we now extract and store just the data we need.
     */
    public function __construct(ChatMessage $message)
    {
        // Extract all needed data from the model
        $this->messageData = [
            'id' => $message->id,
            'message' => $message->message ?: '', // Ensure message is never null
            'text' => $message->message ?: '', // Provide text alternative for frontend
            'sender' => $message->sender,
            'user_name' => $message->user_name,
            'user_email' => $message->user_email,
            'user_phone' => $message->user_phone,
            'created_at' => $message->created_at ? $message->created_at->toDateTimeString() : now()->toDateTimeString(),
            'session_id' => $message->session_id,
        ];

        // Store these separately for channel determination
        $this->sessionId = $message->session_id;
        $this->sender = $message->sender;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn()
    {
        $channels = [
            new Channel('chat.' . $this->sessionId)
        ];

        // If this is a user message, also broadcast to notifications channel for admin sidebar
        if ($this->sender === 'user') {
            $channels[] = new Channel('chat.notifications');
        }

        logger('Broadcasting to channels: ' . json_encode(array_map(function ($channel) {
            return $channel->name;
        }, $channels)) . ' for sender: ' . $this->sender);

        return $channels;
    }

    /**
     * The data to broadcast.
     *
     * @return array
     */
    public function broadcastWith()
    {
        logger('Broadcasting data: ' . json_encode($this->messageData));
        return $this->messageData;
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs()
    {
        return 'message.sent';
    }
}
