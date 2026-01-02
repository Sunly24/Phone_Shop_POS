<?php

return [
  /*
    |--------------------------------------------------------------------------
    | Telegram Bot Configuration
    |--------------------------------------------------------------------------
    */

  // Auth Bot Configuration (for user authentication)
  'auth_bot_token' => env('TELEGRAM_BOT_AUTH_TOKEN'),
  'auth_webhook_url' => env('APP_URL') . '/api/telegram/auth-webhook',

  // Order Bot Configuration (for order notifications)
  'order_bot_token' => env('TELEGRAM_BOT_TOKEN'),
  'order_webhook_url' => env('APP_URL') . '/api/telegram/webhook',

  // Legacy support - keep for backward compatibility
  'bot_token' => env('TELEGRAM_BOT_AUTH_TOKEN'),
  'webhook_url' => env('APP_URL') . '/api/telegram/webhook',
];
