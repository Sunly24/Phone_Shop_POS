<?php

namespace App\Http\Controllers;

use App\Models\TelegramAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramAuthController extends Controller
{
    private $telegramAuthToken;

    public function __construct()
    {
        $this->telegramAuthToken = config('telegram.auth_bot_token');
    }

    public function showVerifyForm()
    {
        return inertia('Telegram/VerifyKey');
    }

    public function verify(Request $request)
    {
        $request->validate([
            'key' => 'required|string'
        ]);

        $user = Auth::user();
        $key = $request->key;

        Log::info("🔍 Auth Bot verification attempt by user {$user->id} with key: {$key}");

        // Check if the current user is already verified with a Telegram account
        $existingUserTelegram = TelegramAuth::where('user_id', $user->id)->first();

        Log::info("🔍 Existing telegram for user {$user->id}: " . ($existingUserTelegram ? 'Found' : 'Not found'));

        if ($existingUserTelegram) {
            Log::info("⚠️ User {$user->id} already verified, returning success");
            return back()->with('flash', ['success' => 'auth-updated']);
        }

        // Find the telegram record by the provided key
        $telegram = TelegramAuth::where('app_key', $key)->first();

        Log::info("🔍 Telegram record for key {$key}: " . ($telegram ? 'Found' : 'Not found'));

        if (!$telegram) {
            Log::info("❌ Invalid key {$key}");
            return back()->with('flash', ['success' => 'auth-invalid']);
        }

        // Check if this telegram key is already linked to another user
        if ($telegram->user_id && $telegram->user_id !== $user->id) {
            $linkedUser = \App\Models\User::find($telegram->user_id);
            Log::info("🔒 Key {$key} already used by user {$telegram->user_id}");
            return back()->with('flash', ['success' => 'auth-invalid']);
        }

        // If user is already verified and trying to use the same key
        if ($telegram->user_id === $user->id) {
            Log::info("ℹ️ User {$user->id} trying to use same key {$key}");
            return back()->with('flash', ['success' => 'auth-updated']);
        }

        // Link the new telegram account
        $telegram->user_id = $user->id;
        $telegram->save();

        Log::info("✅ Linking telegram {$telegram->chatBotID} to user {$user->id}");

        // Automatically set the webhook URL for this bot
        $webhookResult = $this->setWebhookUrl($telegram->chatBotID);

        if ($webhookResult['success']) {
            Log::info("✅ Webhook automatically configured for user {$user->id}, chat {$telegram->chatBotID}");
            return back()->with('flash', [
                'success' => 'auth-linked',
                'telegram_info' => [
                    'username' => $telegram->username,
                    'chat_id' => $telegram->chatBotID,
                    'webhook_url' => $webhookResult['webhook_url'],
                    'linked_at' => now()->format('M d, Y H:i')
                ]
            ]);
        } else {
            Log::warning("⚠️ User linked but webhook setup failed: " . $webhookResult['message']);
            return back()->with('flash', [
                'success' => 'auth-updated',
                'telegram_info' => [
                    'username' => $telegram->username,
                    'chat_id' => $telegram->chatBotID,
                    'error' => $webhookResult['message'],
                    'updated_at' => now()->format('M d, Y H:i')
                ]
            ]);
        }
    }

    /**
     * Handle incoming webhook from Telegram
     */
    public function handleWebhook(Request $request)
    {
        try {
            $update = $request->all();
            Log::info("📨 Received Telegram webhook", $update);

            // Handle regular messages
            if (isset($update['message'])) {
                $this->processMessage($update['message']);
            }

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            Log::error("❌ Error processing webhook: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Automatically set webhook URL for the Telegram bot
     */
    private function setWebhookUrl($chatId)
    {
        try {
            // Get the application URL for the webhook
            $webhookUrl = url('/api/telegram/webhook');

            Log::info("🔗 Setting webhook URL: {$webhookUrl} for chat: {$chatId}");

            // Set the webhook using Telegram Bot API
            $response = Http::post("https://api.telegram.org/bot{$this->telegramAuthToken}/setWebhook", [
                'url' => $webhookUrl,
                'allowed_updates' => ['message', 'my_chat_member'],
                'drop_pending_updates' => true,
            ]);

            $responseData = $response->json();

            if ($response->successful() && $responseData['ok']) {
                Log::info("✅ Webhook set successfully", $responseData);

                // Update the database record with webhook configuration
                TelegramAuth::where('chatBotID', $chatId)->update([
                    'webhook_url' => $webhookUrl,
                    'webhook_configured' => true,
                    'webhook_configured_at' => now(),
                ]);

                // Send confirmation message to the user
                $confirmationMessage = "🎉 Account Successfully Linked!\n" .
                    "═════════════════════════\n" .
                    "✅ Telegram notifications are now ACTIVE\n" .
                    "🔔 You will receive notifications for:\n" .
                    "   • New user registrations\n" .
                    "   • Order updates\n" .
                    "   • System alerts\n" .
                    "═════════════════════════\n" .
                    "🤖 Your bot is now connected to the system!\n" .
                    "⚡ Notifications will be delivered instantly.";

                $this->sendMessage($chatId, $confirmationMessage);

                return [
                    'success' => true,
                    'message' => 'Webhook configured successfully',
                    'webhook_url' => $webhookUrl
                ];
            } else {
                Log::error("❌ Failed to set webhook", $responseData);
                return [
                    'success' => false,
                    'message' => $responseData['description'] ?? 'Unknown error'
                ];
            }
        } catch (\Exception $e) {
            Log::error("❌ Exception setting webhook: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Get current webhook info (for debugging)
     */
    public function getWebhookInfo()
    {
        try {
            $response = Http::get("https://api.telegram.org/bot{$this->telegramAuthToken}/getWebhookInfo");
            $data = $response->json();

            Log::info("📋 Current webhook info:", $data);
            return response()->json($data);
        } catch (\Exception $e) {
            Log::error("❌ Error getting webhook info: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function processMessage($message)
    {
        $chatId = $message['chat']['id'];
        $textReply = '';

        // Check if user is already verified and linked
        $existingUser = TelegramAuth::where('chatBotID', $chatId)->first();
        $isVerified = $existingUser &&
            $existingUser->user_id !== null &&
            $existingUser->webhook_configured === true;

        Log::info("🔍 Chat {$chatId} verification check", [
            'existing_user' => $existingUser ? 'Found' : 'Not found',
            'user_id' => $existingUser->user_id ?? 'null',
            'webhook_configured' => $existingUser->webhook_configured ?? 'null',
            'is_verified' => $isVerified ? 'true' : 'false'
        ]);

        if ($message['text'] == '/start') {
            if ($isVerified) {
                $textReply = "🎉 Welcome back! Your account is already verified!\n\n" .
                    "✅ Status: ACTIVE & CONNECTED\n" .
                    "🔔 Notifications: ENABLED\n\n" .
                    "📱 You are currently receiving notifications for:\n" .
                    "   • New user registrations\n" .
                    "   • Order updates\n" .
                    "   • System alerts\n\n" .
                    "🤖 Your bot is working perfectly!\n" .
                    "═════════════════════════\n" .
                    "⚡ Everything is set up and ready to go!";
            } elseif ($existingUser && $existingUser->user_id !== null) {
                // User has account linked but webhook not properly configured
                $textReply = "⚠️ Account Found but Not Fully Configured\n\n" .
                    "🔍 Status: Your Telegram is linked to a user account, but notifications are not properly set up.\n\n" .
                    "🔧 To fix this:\n" .
                    "1️⃣ Contact your system administrator\n" .
                    "2️⃣ Or try running the webhook update command\n\n" .
                    "💡 Your verification key: " . ($existingUser->app_key ?? 'Not available') . "\n\n" .
                    "📞 Need help? Contact support.";
            } else {
                $textReply = "🤖 Welcome to the User Authentication Bot!\n\n" .
                    "📱 This bot will help you link your Telegram account to your admin dashboard for:\n" .
                    "   • Secure user authentication\n" .
                    "   • Account verification\n" .
                    "   • Admin notifications\n\n" .
                    "🚀 To get started:\n" .
                    "1️⃣ Send /generate_key to get your verification code\n" .
                    "2️⃣ Copy the code you receive\n" .
                    "3️⃣ Go to your admin dashboard → Telegram Verification\n" .
                    "4️⃣ Enter the code in the 'User Bot Verification' tab\n" .
                    "5️⃣ Enjoy secure authentication! 🔐\n\n" .
                    "💡 Need help? Just send /generate_key to begin!";
            }
        }

        if ($message['text'] == '/generate_key') {
            if ($isVerified) {
                $textReply = "✅ You're already verified and connected!\n\n" .
                    "Your Telegram account is already linked to your admin account.\n\n" .
                    "🔔 Current Status:\n" .
                    "   ✅ Account: VERIFIED\n" .
                    "   ✅ Notifications: ACTIVE\n" .
                    "   ✅ Webhook: CONFIGURED\n\n" .
                    "📱 You're receiving notifications for:\n" .
                    "   • New user registrations\n" .
                    "═════════════════════════\n" .
                    "💡 No action needed - everything is working perfectly!\n" .
                    "📞 Need help? Contact your system administrator.";
            } else if ($existingUser) {
                // User has a key but not verified yet
                $textReply = "🔑 You already have a verification key!\n" .
                    "═════════════════════════\n" .
                    "📋 Your Key: {$existingUser->app_key}\n" .
                    "═════════════════════════\n\n" .
                    "⚠️ Important: Keep this key secure!\n" .
                    "✅ Use this key to link your Telegram to your admin account.\n\n" .
                    "📖 Instructions:\n" .
                    "1. Go to your admin dashboard\n" .
                    "2. Navigate to Telegram Verification\n" .
                    "3. Enter the key above\n" .
                    "4. Start receiving notifications! 🔔";
            } else {
                // Generate new key for new user
                $uniqueCode = $this->generateUniqueCode();
                if ($uniqueCode) {
                    // Create new Telegram record
                    TelegramAuth::create([
                        'app_key' => $uniqueCode,
                        'chat_id' => $chatId,
                        'chatBotID' => $chatId,
                        'username' => $message['chat']['username'] ?? $message['chat']['title'] ?? ('user_' . $chatId),
                        'user_id' => null,
                    ]);

                    $textReply = "🎉 New Verification Key Generated!\n" .
                        "═════════════════════════\n" .
                        "📋 Your Key: {$uniqueCode}\n" .
                        "═════════════════════════\n\n" .
                        "🚀 Next Steps:\n" .
                        "1️⃣ Copy the key above\n" .
                        "2️⃣ Go to your admin dashboard\n" .
                        "3️⃣ Find 'Telegram Verification' section\n" .
                        "4️⃣ Paste the key and submit\n" .
                        "5️⃣ Webhook will be configured automatically\n\n" .
                        "🔔 Once linked, you'll receive instant notifications for:\n" .
                        "   • New user registrations\n" .
                        "💡 Keep this key safe - you'll need it to complete the setup!";
                }
            }
        }

        // New commands for verified users
        if ($message['text'] == '/status') {
            if ($isVerified) {
                $user = \App\Models\User::find($existingUser->user_id);
                $webhookStatus = $existingUser->webhook_configured ? 'ACTIVE' : 'INACTIVE';
                $lastConfigured = $existingUser->webhook_configured_at ?
                    $existingUser->webhook_configured_at->format('M d, Y H:i') : 'Never';

                $textReply = "📊 Connection Status Report\n" .
                    "═════════════════════════\n" .
                    "👤 Linked User: " . ($user ? $user->name : 'Unknown') . "\n" .
                    "🔑 Verification: ✅ VERIFIED\n" .
                    "🔗 Webhook: {$webhookStatus}\n" .
                    "📅 Last Updated: {$lastConfigured}\n" .
                    "═════════════════════════\n\n" .
                    "🔔 Notification Status: ACTIVE\n" .
                    "📱 Ready to receive:\n" .
                    "   • New user registrations\n" .
                    "✅ Everything is working perfectly!";
            } else {
                $textReply = "📊 Connection Status Report\n" .
                    "═════════════════════════\n" .
                    "🔑 Verification: ❌ NOT VERIFIED\n" .
                    "🔗 Webhook: ❌ NOT CONFIGURED\n" .
                    "🔔 Notifications: ❌ DISABLED\n" .
                    "═════════════════════════\n\n" .
                    "⚠️ Your account is not linked yet.\n" .
                    "💡 Send /generate_key to get started!";
            }
        }

        if ($message['text'] == '/help') {
            if ($isVerified) {
                $textReply = "🆘 Help & Support\n" .
                    "═════════════════════════\n" .
                    "✅ Your account is verified and active!\n\n" .
                    "🤖 Available Commands:\n" .
                    "   /start - Welcome message\n" .
                    "   /status - Check connection status\n" .
                    "   /help - This help message\n\n" .
                    "🔔 You're receiving notifications for:\n" .
                    "   • New user registrations\n" .
                    "💡 Having issues?\n" .
                    "   Contact your system administrator\n" .
                    "   Check your admin dashboard\n" .
                    "═════════════════════════\n" .
                    "📞 Support: Contact your admin team";
            } else {
                $textReply = "🆘 Help & Support\n" .
                    "═════════════════════════\n" .
                    "🚀 Getting Started:\n" .
                    "1️⃣ Send /generate_key\n" .
                    "2️⃣ Copy your verification code\n" .
                    "3️⃣ Go to admin dashboard\n" .
                    "4️⃣ Enter code in Telegram Verification\n" .
                    "5️⃣ Start receiving notifications!\n\n" .
                    "🤖 Available Commands:\n" .
                    "   /start - Welcome message\n" .
                    "   /generate_key - Get verification code\n" .
                    "   /help - This help message\n\n" .
                    "💡 Need assistance?\n" .
                    "   Contact your system administrator\n" .
                    "═════════════════════════\n" .
                    "📞 Support: Contact your admin team";
            }
        }

        // Send the reply message
        if ($textReply) {
            $this->sendMessage($chatId, $textReply);
        }
    }

    private function generateUniqueCode($length = 30)
    {

        // Generate a random string of 30 characters
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        $randomPart = '';
        for ($i = 0; $i < $length; $i++) {
            $randomPart .= $chars[rand(0, strlen($chars) - 1)];
        }
        $timestamp = time() * 1000;
        return $randomPart . $timestamp;
    }

    private function sendMessage($chatId, $text)
    {
        Http::post("https://api.telegram.org/bot{$this->telegramAuthToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
        ]);
    }
}
