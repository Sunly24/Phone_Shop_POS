<?php
namespace App\Traits;

use App\Models\Telegram;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait SendsTelegramNotification
{
    public function sendTelegramMessage(int $userId, string $message): bool
    {
        try {
            $telegram = Telegram::where('user_id', $userId)->first();
            if (!$telegram) {
                $telegram = Telegram::whereNotNull('chatBotID')->first();
                if (!$telegram) return false;
            }
            $telegramToken = config('services.telegram.bot_token');
            if (!$telegramToken) return false;

            $telegramApiUrl = "https://api.telegram.org/bot{$telegramToken}/sendMessage";
            $response = Http::withOptions(['verify' => false])->post($telegramApiUrl, [
                'chat_id' => $telegram->chatBotID,
                'text' => $message,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ]);
            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Failed to send Telegram message: " . $e->getMessage());
            return false;
        }
    }
}