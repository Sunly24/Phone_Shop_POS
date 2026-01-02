<?php

namespace App\Services;

use App\Models\TelegramAuth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
  private $telegramAuthToken;

  public function __construct()
  {
    $this->telegramAuthToken = config('telegram.auth_bot_token');
  }

  /**
   * Send a message to a specific chat
   */
  public function sendMessage($chatId, $text)
  {
    try {
      $response = Http::post("https://api.telegram.org/bot{$this->telegramAuthToken}/sendMessage", [
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML'
      ]);

      if ($response->successful()) {
        Log::info("✅ Telegram message sent successfully to chat: {$chatId}");
        return true;
      } else {
        Log::error("❌ Failed to send Telegram message to chat: {$chatId}", $response->json());
        return false;
      }
    } catch (\Exception $e) {
      Log::error("❌ Exception sending Telegram message: " . $e->getMessage());
      return false;
    }
  }

  /**
   * Send notification to all connected admin users
   */
  public function sendNotificationToAdmins($message)
  {
    // Get all telegram auths that are connected to users (have user_id)
    // and where webhook is configured
    $telegramAuths = TelegramAuth::whereNotNull('user_id')
      ->where('webhook_configured', true)
      ->with('user.roles')
      ->get();

    $sentCount = 0;
    foreach ($telegramAuths as $telegramAuth) {
      // Check if user has admin role or specific permissions
      if ($telegramAuth->user && ($telegramAuth->user->hasRole('Admin') || $telegramAuth->user->can('user-list'))) {
        if ($this->sendMessage($telegramAuth->chat_id, $message)) {
          $sentCount++;
        }
      }
    }

    Log::info("📊 Sent notification to {$sentCount} admin(s) via Telegram");
    return $sentCount;
  }

  /**
   * Send notification to a specific user
   */
  public function sendNotificationToUser($userId, $message)
  {
    $telegramAuth = TelegramAuth::where('user_id', $userId)
      ->where('webhook_configured', true)
      ->first();

    if ($telegramAuth) {
      return $this->sendMessage($telegramAuth->chat_id, $message);
    }

    return false;
  }

  /**
   * Format user registration notification message
   */
  public function formatUserRegistrationMessage($user)
  {
    $verificationStatus = $user->hasVerifiedEmail() ? "✅ <b>Verified</b>" : "⏳ <b>Pending Verification</b>";
    $verificationTime = $user->email_verified_at ?
      "\n📧 <b>Email Verified:</b> " . $user->email_verified_at->format('Y-m-d H:i:s') :
      "";

    return "🎉 <b>New User Registration Complete</b>\n\n" .
      "👤 <b>Name:</b> {$user->name}\n" .
      "📧 <b>Email:</b> {$user->email}\n" .
      "🔐 <b>Status:</b> {$verificationStatus}\n" .
      "📅 <b>Registered:</b> " . $user->created_at->format('Y-m-d H:i:s') . $verificationTime . "\n" .
      "🆔 <b>User ID:</b> #{$user->id}\n\n" .
      "📊 Total verified users: " . \App\Models\User::whereNotNull('email_verified_at')->count() .
      " / " . \App\Models\User::count() . " total";
  }
}
