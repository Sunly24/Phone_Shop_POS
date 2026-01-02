<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use App\Models\KHQR;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\Customer;
use App\Models\Invoice;
use App\Events\BakongPaymentCompleted;
use App\Models\Telegram;
use App\Events\OrderNotification;

class KHQRController extends Controller
{
    private $accessToken;

    public function __construct()
    {
        $this->accessToken = config('services.khqr.token');
    }

    // Generate KHQR and QR image
    public function generate(Request $request)
    {
        try {
            $amount = number_format($request->input('amount', 0.03), 2, '.', '');
            $currency = $request->input('currency', 'USD');
            $billNumber = $request->input('bill_number', 'TRX' . time() . rand(100, 999));

            $payload = $this->buildKHQRPayload([
                'bank_account'   => 'sereivathana_chort@aclb',
                'merchant_name'  => 'Sereivathana Chort',
                'merchant_city'  => 'Phnom Penh',
                'amount'         => $amount,
                'currency'       => $currency,
                'store_label'    => 'Phone Shop',
                'bill_number'    => $billNumber,
                'terminal_label' => 'POS Terminal 1',
            ]);

            // Generate & save the QR‐code image
            $qrCode   = new QrCode($payload);
            $writer   = new PngWriter();
            $qrImage  = $writer->write($qrCode);
            $filename = "khqr/{$billNumber}.png";

            if (! Storage::disk('public')->exists('khqr')) {
                Storage::disk('public')->makeDirectory('khqr');
            }
            Storage::disk('public')->put($filename, $qrImage->getString());
            $qrUrl = asset("storage/{$filename}");

            // Create DB record (initially PENDING)
            $md5  = md5($payload);

            // Save KHQR record
            $khqr = KHQR::create(
                [
                    'bill_number' => $billNumber,
                    'payload'     => $payload,
                    'md5'         => $md5,
                    'qr_url'      => $qrUrl,
                    'amount'      => $amount,
                    'currency'    => $currency,
                    'status'      => 'PENDING',
                    'order_id'    => $request->input('order_id', null),
                ]
            );

            return response()->json([
                'qr_url' => $qrUrl,
                'md5' => $md5,
                'bill_number' => $billNumber,
                'status' => 'PENDING',
                'amount' => $amount,
                'currency' => $currency,
            ]);
        } catch (\Exception $e) {
            Log::error('KHQR generate error: ' . $e->getMessage());
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function checkPaymentByMD5(Request $request)
    {
        try {
            $request->validate([
                'md5' => 'required|string',
            ]);

            $md5 = $request->input('md5');
            $token = config('services.khqr.token');

            $BASE_URL = 'https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5';
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ])->post($BASE_URL, ['md5' => $md5]);

            if ($response->successful()) {
                $data = $response->json();

                // Initialize isPaid to false
                $isPaid = false;
                if (
                    isset($data['responseCode']) && $data['responseCode'] === 0 &&
                    !empty($data['data']['hash'])
                ) {
                    $isPaid = true;

                    // Update payment status in your DB
                    KHQR::where('md5', $md5)->update(['status' => 'PAID']);

                    // Add notification and telegram here
                    $khqr = KHQR::where('md5', $md5)->first();
                    $order = Order::where('md5_hash', $md5)->first();
                    if ($order) {
                        broadcast(new OrderNotification(
                            $order->order_id,
                            $order->customer->name ?? 'N/A',
                            $order->total_payment,
                            $order->currency,
                            $order->user->name ?? 'N/A',
                            $order->items()->first()->product_title ?? 'N/A',
                            'created'
                        ));
                        $this->sendTelegramNotification($order);
                    }
                }

                return response()->json([
                    'success' => true,
                    'responseMessage' => $data['responseMessage'] ?? null,
                    'paid' => $isPaid,
                    'data' => $data,
                    'status' => $isPaid ? 'PAID' : 'PENDING',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to check transaction',
                    'error' => $response->body(),
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('KHQR checkPaymentByMD5 error: ' . $e->getMessage());
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    // Bakong webhook for real-time payment notification
    public function handleWebhook(Request $request)
    {
        try {
            $md5 = $request->input('md5');
            $status = $request->input('status');
            $transactionId = $request->input('transaction_id');
            $khqr = KHQR::where('md5', $md5)->first();
            if ($khqr && $status === 'PAID') {
                $khqr->status = 'PAID';
                $khqr->transaction_id = $transactionId;
                $khqr->save();

                $order = Order::where('md5_hash', $khqr->md5)->first();
                if ($order) {
                    broadcast(new OrderNotification(
                        $order->order_id,
                        $order->customer->name ?? 'N/A',
                        $order->total_payment,
                        $order->currency,
                        $order->user->name ?? 'N/A',
                        $order->items()->first()->product_title ?? 'N/A',
                        'created'
                    ));
                    $this->sendTelegramNotification($order);
                }

                return response()->json(['success' => true]);
            }
            return response()->json(['success' => false], 400);
        } catch (\Exception $e) {
            Log::error('KHQR handleWebhook error: ' . $e->getMessage());
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    // Sent message to telegram bot
    private function sendTelegramNotification($order)
    {
        try {
            if (!$order->relationLoaded('customer')) {
                $order->load('customer');
            }
            if (!$order->relationLoaded('items')) {
                $order->load('items');
            }
            $telegram = Telegram::where('user_id', $order->user_id)->first();
            if (!$telegram) {
                $telegram = Telegram::whereNotNull('chatBotID')->first();
                if (!$telegram) return false;
            }
            $telegramToken = config('services.telegram.bot_token') ?? env('TELEGRAM_BOT_TOKEN');
            if (!$telegramToken) return false;
            $telegramApiUrl = "https://api.telegram.org/bot{$telegramToken}/sendMessage";
            $orderDate = $order->created_at ? $order->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
            $amountDisplay = $order->currency === 'KHR'
                ? number_format($order->total_payment * 4000, 0) . ' ៛'
                : '$' . number_format($order->total_payment, 2);
            $message = "===============================\n";
            $message .= "🎉 <b>KHQR E-Wallet Payment Received!</b>\n";
            $message .= "===============================\n";
            $message .= "📋 <b>Order ID:</b> {$order->order_id}\n";
            $message .= "📅 <b>Date:</b> {$orderDate}\n";
            if ($order->customer) {
                $message .= "👤 <b>Customer:</b> {$order->customer->name}\n";
                if ($order->customer->phone) {
                    $message .= "📱 <b>Phone:</b> {$order->customer->phone}\n";
                }
            }
            if ($order->items && $order->items->count() > 0) {
                $message .= "📦 <b>Items:</b>\n";
                foreach ($order->items as $item) {
                    $itemPrice = $order->currency === 'KHR'
                        ? number_format($item->product_price * 4000, 0) . ' ៛'
                        : '$' . number_format($item->product_price, 2);
                    $message .= "   • {$item->product_title} x{$item->quantity} ({$itemPrice})\n";
                }
            }
            $message .= "💰 <b>Amount:</b> {$amountDisplay}\n";
            $message .= "📌 <b>Status:</b> PAID ✅\n";
            $message .= "💳 <b>Payment Method:</b> KHQR E-Wallet\n";
            $message .= "===============================\n";
            $message .= "<i>Payment processed automatically via KHQR</i>";
            $response = Http::withOptions(['verify' => false])->post($telegramApiUrl, [
                'chat_id' => $telegram->chatBotID,
                'text' => $message,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ]);
            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Telegram notification error: " . $e->getMessage());
            return false;
        }
    }

    // Build KHQR payload string
    private function buildKHQRPayload(array $data): string
    {
        $payload = '';

        // Payload Format Indicator
        $payload .= $this->emv('00', '01');

        // Point of Initiation Method: 12 = dynamic
        $payload .= $this->emv('01', '12');

        // Merchant Account Information (Tag 29)
        $merchant = '';
        $merchant .= $this->emv('00', 'sereivathana_chort@aclb');
        $merchant .= $this->emv('01', $data['bank_account']);
        $payload .= $this->emv('29', $merchant);

        // Merchant Category Code
        $payload .= $this->emv('52', '0000');

        // Currency Code
        $payload .= $this->emv('53', $data['currency'] === 'KHR' ? '116' : '840');

        // Transaction Amount
        $payload .= $this->emv('54', $data['amount']);

        // Country Code
        $payload .= $this->emv('58', 'KH');

        // Merchant Name (max 25 characters)
        $payload .= $this->emv('59', substr($data['merchant_name'], 0, 25));

        // Merchant City (max 15 characters)
        $payload .= $this->emv('60', substr($data['merchant_city'], 0, 15));

        // Additional Data Field Template (Tag 62)
        $additional = '';
        $additional .= $this->emv('01', $data['bill_number']);
        $additional .= $this->emv('02', $data['store_label']);
        $additional .= $this->emv('03', $data['terminal_label']);
        $payload .= $this->emv('62', $additional);

        // CRC16 Checksum (Tag 63)
        $payload .= '6304';
        $crc = strtoupper(dechex($this->crc16($payload)));
        $payload .= str_pad($crc, 4, '0', STR_PAD_LEFT);

        return $payload;
    }

    /**
     * Encode EMV field
     */
    private function emv(string $id, string $value): string
    {
        $length = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
        return $id . $length . $value;
    }

    /**
     * Generate CRC16 for KHQR payload
     */
    private function crc16(string $str): int
    {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($str); $i++) {
            $crc ^= ord($str[$i]) << 8;
            for ($j = 0; $j < 8; $j++) {
                $crc = ($crc & 0x8000)
                    ? ($crc << 1) ^ 0x1021
                    : $crc << 1;
                $crc &= 0xFFFF;
            }
        }
        return $crc;
    }
}
