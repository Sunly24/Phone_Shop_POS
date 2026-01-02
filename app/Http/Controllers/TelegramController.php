<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\Telegram;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TelegramController extends Controller
{
    protected $telegramToken;

    public function __construct()
    {
        $this->telegramToken = config('telegram.order_bot_token');
    }

    public function handleWebhook(Request $request)
    {
        try {
            $message = $request->input('message');

            // If we have a message with text, process it as a command
            if ($message && isset($message['text'])) {
                $this->handleCommands($message);

                return response()->json([
                    'status' => true,
                    'message' => 'Command processed successfully'
                ]);
            }

            // Handle order notifications
            $chatidbot = $request->input('chatidbot');
            $username = $request->input('username');
            $total = $request->input('total');
            $appKey = $request->input('app_key');

            if ($chatidbot && $username && $total) {
                // ... existing order handling code ...
            }

            return response()->json([
                'status' => true,
                'message' => 'Webhook received'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function handleCommands($message)
    {
        try {
            $chatId = $message['chat']['id'] ?? null;
            $text = $message['text'] ?? '';
            $reply = '';

            if (!$chatId) {
                return;
            }

            if ($text === '/start') {
                $reply = "🎉 សូមស្វាគមន៍មកកាន់ Phone Shop POS Bot!\n\n";
                $reply .= "សូមវាយអរក្សᖖ /generate_key ដើម្បីបានលេខកូដយកទៅកំណត់ក្នុង System អ្នក";
            } elseif ($text === '/generate_key') {


                $uniqueCode = $this->generateUniqueCode();

                $existingUser = Telegram::where('chatBotID', $chatId)->first();

                if ($existingUser) {
                    $reply = "⚠️ អ្នកមានលេខកូដរួចហើយ:\n";
                    $reply .= "======||======||======\n";
                    $reply .= "{$existingUser->app_key}\n";
                    $reply .= "======||======||======";
                    $reply .= "\nសូមរក្សាលេខកូដនេះឲ្យបានសុវត្ថិភាព។ អ្នកអាចប្រើវាដើម្បីភ្ជាប់ Telegram Bot របស់អ្នកទៅកាន់គណនីរបស់អ្នក។";
                } else {
                    // Get username or fallback to chat ID
                    $tel_username = $message['chat']['username'] ?? ('user_' . $chatId);

                    $telegram = new Telegram();
                    $telegram->app_key = $uniqueCode;
                    $telegram->chatBotID = $chatId;
                    $telegram->tel_username = $tel_username;
                    $telegram->save();

                    $reply = "🔑 នេះជាលេខកូដសំងាត់របស់អ្នក៖\n";
                    $reply .= "======||======||======\n";
                    $reply .= "{$uniqueCode}\n";
                    $reply .= "======||======||======";
                    $reply .= "\nសូមរក្សាលេខកូដនេះឲ្យបានសុវត្ថិភាព។ អ្នកអាចប្រើវាដើម្បីភ្ជាប់ Telegram Bot របស់អ្នកទៅកាន់គណនីរបស់អ្នក។";
                }
            }

            if ($reply) {
                $this->sendMessage($chatId, $reply);
            }
        } catch (\Exception $e) {
            if (isset($chatId)) {
                $this->sendMessage($chatId, "❌ មានបញ្ហាក្នុងការបង្កើតលេខកូដ។ សូមព្យាយាមម្តងទៀត។");
            }
        }
    }

    private function generateUniqueCode($length = 30)
    {
        return Str::random($length) . time();
    }


    private function sendMessage($chatId, $text)
    {
        try {
            $response = Http::withOptions(['verify' => false])->post("https://api.telegram.org/bot{$this->telegramToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error('Error sending message: ' . $e->getMessage());
            return false;
        }
    }

    public function verify(Request $request)
    {
        $request->validate([
            'key' => 'required|string'
        ]);

        $user = Auth::user();
        $telegram = Telegram::where('app_key', $request->key)->first();

        if (!$telegram) {
            return back()->with('flash', ['success' => 'order-invalid']);
        }

        if ($telegram->user_id && $telegram->user_id !== $user->id) {
            // Key already used by another user
            return back()->with('flash', ['success' => 'order-invalid']);
        }

        if ($telegram->user_id === $user->id) {
            // Already linked to current user
            return back()->with('flash', ['success' => 'order-updated']);
        }

        // Link the telegram account to current user
        $telegram->user_id = $user->id;
        $telegram->save();

        return back()->with('flash', ['success' => 'order-linked']);
    }
}
