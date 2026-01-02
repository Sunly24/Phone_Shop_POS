<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use Illuminate\Support\Facades\Response;

class NotificationController extends Controller
{
    /**
     * Get latest notifications from database
     */
    public function getNotifications(Request $request)
    {
        $notifications = Notification::with('user')
            ->recent(20)
            ->get()
            ->map(function ($notification) {
                $baseData = [
                    'id' => $notification->id,
                    'action' => $notification->data['action'] ?? 'created',
                    'productTitle' => $notification->data['product_title'] ?? 'Phone',
                    'price' => $notification->data['price'] ?? $notification->data['total'] ?? '0.00',
                    'username' => $notification->data['username'] ?? ($notification->user->name ?? 'System'),
                    'time' => $notification->created_at->format('M j, Y g:i A'),
                    'timeAgo' => $notification->time_ago,
                    'read' => $notification->isRead(),
                    'type' => $notification->type,
                ];

                // Add product-specific fields for product notifications
                if (str_starts_with($notification->type, 'product_')) {
                    $baseData['productId'] = $notification->data['product_id'] ?? null;
                }

                // Add order-specific fields for order notifications
                if ($notification->type === 'order_created') {
                    $baseData['orderId'] = $notification->data['order_id'] ?? null;
                    $baseData['customerName'] = $notification->data['customer_name'] ?? null;
                    $baseData['currency'] = $notification->data['currency'] ?? 'USD';
                }

                return $baseData;
            });

        return response()->json($notifications);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::find($id);

        if ($notification) {
            $notification->markAsRead();
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
    }

    /**
     * Clear all notifications (mark as read)
     */
    public function clearAll()
    {
        Notification::whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['success' => true]);
    }

    /**
     * Get unread notifications count
     */
    public function getUnreadCount()
    {
        $count = Notification::unread()->count();
        return response()->json(['count' => $count]);
    }

    /**
     * Delete notification
     */
    public function delete($id)
    {
        $notification = Notification::find($id);

        if ($notification) {
            $notification->delete();
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
    }
}
