<?php

namespace App\Listeners;

use App\Events\UserRegistered;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use App\Services\TelegramService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SendTelegramUserRegistrationNotification
{

  protected $telegramService;

  /**
   * Create the event listener.
   */
  public function __construct(TelegramService $telegramService)
  {
    $this->telegramService = $telegramService;
  }

  /**
   * Handle the event.
   */
  public function handle($event): void
  {
    try {
      // Extract user from different event types
      $user = null;
      $eventType = get_class($event);

      if ($event instanceof UserRegistered) {
        $user = $event->user;
      } elseif ($event instanceof Registered) {
        $user = $event->user;
      } elseif ($event instanceof Verified) {
        $user = $event->user;
      }

      // Check if the user still exists
      if (!$user || !$user->exists) {
        Log::warning("⚠️ Telegram notification skipped: User no longer exists", [
          'user_id' => $user->id ?? 'unknown',
          'event_type' => $eventType
        ]);
        return;
      }

      // Deduplication: Check if we recently sent a notification for this user
      $cacheKey = "telegram_notification_sent_user_{$user->id}";
      if (Cache::has($cacheKey)) {
        Log::info("🔄 Telegram notification skipped - duplicate detected", [
          'user_id' => $user->id,
          'user_email' => $user->email,
          'event_type' => $eventType
        ]);
        return;
      }

      // Set cache for 30 seconds to prevent duplicates
      Cache::put($cacheKey, true, 30);

      // Format the registration message
      $message = $this->telegramService->formatUserRegistrationMessage($user);

      // Send notification to all admins
      $sentCount = $this->telegramService->sendNotificationToAdmins($message);

      Log::info("📱 User registration notification sent via Telegram", [
        'user_id' => $user->id,
        'user_email' => $user->email,
        'user_name' => $user->name,
        'admins_notified' => $sentCount,
        'event_type' => $eventType
      ]);
    } catch (\Exception $e) {
      Log::error("❌ Failed to send Telegram notification for user registration", [
        'user_id' => $user->id ?? 'unknown',
        'event_type' => $eventType,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);

      // Don't re-throw the exception to prevent job from failing repeatedly
      // Instead, just log the error and continue
    }
  }
}
