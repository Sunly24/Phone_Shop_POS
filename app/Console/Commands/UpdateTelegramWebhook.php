<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\TelegramAuth;

class UpdateTelegramWebhook extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'telegram:update-webhook {--auto-detect : Automatically detect ngrok URL} {--url= : Manually specify webhook URL} {--type=all : Webhook type (auth, order, or all)}';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Update Telegram webhook URLs for both user registration and order notifications (useful when ngrok restarts)';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    $webhookType = $this->option('type') ?? 'all';

    if (!in_array($webhookType, ['auth', 'order', 'all'])) {
      $this->error('❌ Invalid webhook type. Use: auth, order, or all');
      return 1;
    }

    $this->info("🚀 Updating Telegram webhooks for: " . ($webhookType === 'all' ? 'both auth and order bots' : $webhookType . ' bot'));

    $results = [];

    if ($webhookType === 'auth' || $webhookType === 'all') {
      $results['auth'] = $this->updateWebhook('auth');
    }

    if ($webhookType === 'order' || $webhookType === 'all') {
      $results['order'] = $this->updateWebhook('order');
    }

    // Summary
    $this->info("\n📊 Webhook Update Summary:");
    foreach ($results as $type => $success) {
      $status = $success ? '✅ Success' : '❌ Failed';
      $this->info("  {$type} bot: {$status}");
    }

    return array_sum($results) > 0 ? 0 : 1;
  }

  /**
   * Update webhook for a specific bot type
   */
  private function updateWebhook($type)
  {
    // Get bot token
    $telegramToken = $type === 'auth'
      ? config('services.telegram.auth_bot_token')
      : config('services.telegram.bot_token');

    if (!$telegramToken) {
      $this->error("❌ {$type} bot token not found in environment variables");
      $this->error("Make sure TELEGRAM_BOT_" . strtoupper($type === 'auth' ? 'AUTH_' : '') . "TOKEN is set in your .env file");
      return false;
    }

    // Get webhook URL
    $webhookUrl = $this->getWebhookUrl($type);
    if (!$webhookUrl) {
      return false;
    }

    $this->info("📡 Setting {$type} webhook URL: {$webhookUrl}");

    // Update Telegram webhook
    $response = Http::post("https://api.telegram.org/bot{$telegramToken}/setWebhook", [
      'url' => $webhookUrl,
      'allowed_updates' => ['message', 'my_chat_member'],
      'drop_pending_updates' => true,
    ]);

    $responseData = $response->json();

    if ($response->successful() && $responseData['ok']) {
      $this->info("✅ {$type} bot webhook updated successfully!");

      // Update database records based on bot type
      if ($type === 'auth') {
        // Update TelegramAuth records
        $updatedCount = \App\Models\TelegramAuth::where('webhook_configured', true)
          ->update([
            'webhook_url' => $webhookUrl,
            'webhook_configured_at' => now(),
          ]);
        $this->info("📊 Updated {$updatedCount} TelegramAuth webhook record(s)");
      } else {
        // Update Telegram records for order notifications
        $updatedCount = \App\Models\Telegram::whereNotNull('chatBotID')
          ->update(['updated_at' => now()]);
        $this->info("📊 Updated {$updatedCount} Telegram order webhook record(s)");
      }

      Log::info("✅ {$type} bot webhook set via command", [
        'webhook_url' => $webhookUrl,
        'response' => $responseData
      ]);

      return true;
    } else {
      $this->error("❌ Failed to set {$type} webhook: " . ($responseData['description'] ?? 'Unknown error'));
      Log::error("❌ Failed to set {$type} webhook via command", $responseData);
      return false;
    }
  }

  /**
   * Get webhook URL for specific bot type
   */
  private function getWebhookUrl($type)
  {
    $webhookPath = $type === 'auth' ? '/api/telegram/auth-webhook' : '/api/telegram/webhook';
    $webhookUrl = null;

    if ($this->option('url')) {
      // Manual URL provided
      $webhookUrl = $this->option('url') . $webhookPath;
      $this->info("🔗 Using manual URL for {$type}: {$webhookUrl}");
    } elseif ($this->option('auto-detect')) {
      // Auto-detect ngrok URL
      $ngrokUrl = $this->getNgrokUrl();
      if (!$ngrokUrl) {
        $this->error('❌ Could not detect ngrok URL. Make sure ngrok is running.');
        return null;
      }
      $webhookUrl = $ngrokUrl . $webhookPath;
      $this->info("🔗 Detected ngrok URL for {$type}: {$webhookUrl}");
    } else {
      // Interactive mode - try different detection methods

      // First, try to use APP_URL from environment if it's not localhost
      $appUrl = config('app.url');
      if ($appUrl && !str_contains($appUrl, 'localhost') && !str_contains($appUrl, '127.0.0.1')) {
        $webhookUrl = $appUrl . $webhookPath;
        $this->info("🔗 Using APP_URL for {$type}: {$appUrl}");
        return $webhookUrl;
      }

      // Second, try auto-detecting ngrok (for local development)
      $ngrokUrl = $this->getNgrokUrl();
      if ($ngrokUrl) {
        $webhookUrl = $ngrokUrl . $webhookPath;
        $this->info("🔗 Auto-detected ngrok URL for {$type}: {$ngrokUrl}");
        return $webhookUrl;
      } else {
        // Only ask for manual input if both methods fail
        $this->warn("⚠️  Could not auto-detect URL. APP_URL: {$appUrl}");
        $this->info("💡 Tip: Set APP_URL in .env for production, or start ngrok for local development");
        $customUrl = $this->ask("Enter your webhook base URL for {$type} (without {$webhookPath})");
        $webhookUrl = $customUrl . $webhookPath;
      }
    }

    return $webhookUrl;
  }

  /**
   * Get current ngrok URL from local API
   */
  private function getNgrokUrl()
  {
    try {
      $response = Http::timeout(5)->get('http://localhost:4040/api/tunnels');

      if ($response->successful()) {
        $data = $response->json();

        if (isset($data['tunnels'][0]['public_url'])) {
          return $data['tunnels'][0]['public_url'];
        }
      }
    } catch (\Exception $e) {
      // ngrok API not available
    }

    return null;
  }
}
