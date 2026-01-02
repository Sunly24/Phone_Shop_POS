<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TelegramController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\KHQRController;
use App\Http\Controllers\TelegramAuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\KHQRUserController;


// ============================================
// PUBLIC API ROUTES (No Authentication Required)
// ============================================

// Telegram Webhook Routes
// telegram
Route::post('/telegram/webhook', [TelegramController::class, 'handleWebhook']);
Route::get('/telegram/setup-webhook', [TelegramController::class, 'setupWebhook']);
Route::get('/telegram/webhook-info', [TelegramController::class, 'getWebhookInfo']);

// KHQR webhook for Bakong payment notifications
Route::post('/bakong/webhook', [KHQRController::class, 'handleWebhook']);
Route::post('/bakong/check-status', [KHQRController::class, 'checkPaymentByMD5'])->name('bakong.check.status');

Route::post('/user/qr/generate', [KHQRUserController::class, 'generate']);
Route::post('/user/qr/check', [KHQRUserController::class, 'check']);

// Notification routes
Route::get('/notifications', [NotificationController::class, 'getNotifications']);
Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::delete('/notifications/{id}', [NotificationController::class, 'delete']);
Route::delete('/notifications', [NotificationController::class, 'clearAll']);
Route::post('/telegram/auth-webhook', [TelegramAuthController::class, 'handleWebhook']);

// Chat API Routes (Public access for frontend chat widget)
Route::prefix('chat')->group(function () {
    Route::post('/session', [ChatController::class, 'createSession']);
    Route::post('/message', [ChatController::class, 'store']);
    Route::get('/messages/{sessionId}', [ChatController::class, 'getMessages']);
    Route::get('/check-session/{sessionId}', [ChatController::class, 'checkSessionExists']);
});

// ============================================
// API AUTHENTICATION ROUTES
// ============================================
Route::prefix('auth')->group(function () {
    // Public auth endpoints
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// ============================================
// PROTECTED API ROUTES (Sanctum Authentication)
// Note: Uses 'api' guard which is configured to use Sanctum driver
// ============================================
Route::middleware(['auth'])->group(function () {
    // Authentication endpoints
    Route::prefix('auth')->group(function () {
        Route::get('/user', function (Request $request) {
            return $request->user();
        });
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    });

    // User Management
    Route::prefix('users')->group(function () {
        Route::get('/agents', [UserController::class, 'getAgents']);
        Route::post('/import', [UserController::class, 'import']);
        // Route::get('/export', [UserController::class, 'export']);
    });

    // Add other protected API endpoints here as needed
});
