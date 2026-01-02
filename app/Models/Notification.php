<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'user_id',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    public function scopeRecent($query, $limit = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }

    // Helper methods
    public function markAsRead()
    {
        $this->update(['read_at' => now()]);
    }

    public function isRead()
    {
        return !is_null($this->read_at);
    }

    public function getTimeAgoAttribute()
    {
        return $this->created_at->diffForHumans();
    }

    // Static methods
    public static function createProductNotification($productId, $action, $productTitle, $price, $username, $userId = null)
    {
        return self::create([
            'type' => 'product_' . $action,
            'title' => ucfirst($action) . ': ' . $productTitle,
            'message' => "Product '{$productTitle}' was {$action} by {$username}",
            'data' => [
                'product_id' => $productId,
                'action' => $action,
                'product_title' => $productTitle,
                'price' => $price,
                'username' => $username,
            ],
            'user_id' => $userId,
        ]);
    }

    public static function createOrderNotification($orderId, $customerName, $total, $username, $userId = null, $productTitle = null, $currency = 'USD', $action = 'created')
    {
        return self::create([
            'type' => 'order_' . $action,
            'title' => ucfirst($action) . ' Order: #' . $orderId,
            'message' => "Order #{$orderId} was {$action} for {$customerName} by {$username}" . ($productTitle ? " - {$productTitle}" : ""),
            'data' => [
                'order_id' => $orderId,
                'customer_name' => $customerName,
                'total' => $total,
                'username' => $username,
                'product_title' => $productTitle,
                'currency' => $currency,
                'action' => $action,
            ],
            'user_id' => $userId,
        ]);
    }
}
