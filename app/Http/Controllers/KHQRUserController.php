<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KHQR;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Notification; 
use App\Models\Telegram;
use App\Events\OrderNotification;
use App\Events\ProductStockUpdated;
use Illuminate\Support\Facades\Log;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Storage;
use App\Events\BakongPaymentCompleted;
use Illuminate\Support\Facades\Http;

class KHQRUserController extends Controller
{
    private $accessToken;

    public function __construct()
    {
        $this->accessToken = config('services.khqr.token');
        
        if (empty($this->accessToken)) {
            Log::warning('KHQR JWT token not configured in environment. Please set KHQR_JWT_TOKEN in .env file');
        }
    }

    public function generate(Request $request)
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:0.01',
                'currency' => 'required|string|in:USD,KHR',
                'bill_number' => 'required|string'
            ]);

            $amount = max(0.01, (float)$request->input('amount'));
            $amount = number_format($amount, 2, '.', '');
            $billNumber = $request->input('bill_number', 'TRX'.time().rand(100, 999));
            $currency = $request->input('currency', 'USD');

            Log::info("Generating KHQR for {$billNumber} (amount={$amount} {$currency})");

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

             $qrCode = new QrCode($payload);
            $writer = new PngWriter();
            $qrImage = $writer->write($qrCode);
            $filename = "khqr/{$billNumber}.png";

            if (!Storage::disk('public')->exists('khqr')) {
                Storage::disk('public')->makeDirectory('khqr');
            }

            Storage::disk('public')->put($filename, $qrImage->getString());
            $qrUrl = asset("storage/{$filename}");

            Log::info("QR code generated successfully: {$filename}");

            $md5 = md5($payload);

            KHQR::where('status', 'PENDING')
                ->whereNull('order_id')
                ->where('created_at', '<', now()->subMinutes(30))
                ->delete();

             $khqr = KHQR::updateOrCreate(
                ['bill_number' => $billNumber],
                [
                    'payload'     => $payload, // Make sure this is included!
                    'md5'         => $md5,
                    'qr_url'      => $qrUrl,
                    'amount'      => $amount,
                    'currency'    => $currency,
                    'status'      => 'PENDING',
                    'order_id'    => $request->input('order_id', null),
                    'user_id'     => $request->input('user_id'),
                ]
            );

            $responseData = [
                'success'     => true,
                'qr_url'      => $qrUrl,
                'payload'     => $payload,
                'md5'         => $md5,
                'bill_number' => $billNumber,
                'status'      => 'PENDING',
                'khqr_id'     => $khqr->id,
                'amount'      => $amount,
                'currency'    => $currency,
            ];

            return response()->json($responseData);

        } catch (\Exception $e) {
            Log::error('KHQR generate error: '.$e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate QR: '.$e->getMessage()
            ], 500);
        }
    }


    public function check(Request $request)
    {
        $request->validate([
            'md5' => 'required|string',
        ]);

        return $this->checkPaymentByMD5($request);
    }

    /**
     * Check payment status by md5 (for Postman/manual testing)
     */
    public function checkPaymentByMD5(Request $request)
    {
        $request->validate([
            'md5' => 'required|string',
        ]);
        $md5 = $request->input('md5');
        $khqr = KHQR::where('md5', $md5)->first();

        if (!$khqr) {
            \Log::warning("KHQR not found for md5: $md5");
            return response()->json(['status' => 'NOT_FOUND'], 404);
        }

        // If already paid, ensure order is created
        if ($khqr->status === 'PAID') {
            if (!$khqr->order_id) {
                $this->autoCreateOrder($khqr, $khqr->transaction_id);
                $this->sendTelegramNotification($order);
            }
            broadcast(new \App\Events\BakongPaymentCompleted($khqr, $khqr->transaction_id));
            return response()->json([
                'status' => 'PAID',
                'bill_number' => $khqr->bill_number,
                'is_paid' => true,
                'transaction_id' => $khqr->transaction_id,
            ]);
        }

        // Otherwise, check with Bakong API
        $token = config('services.khqr.token') ?? env('BAKONG_API_TOKEN') ?? env('KHQR_JWT_TOKEN');
        if (empty($token)) {
            \Log::error('Bakong API token not configured');
            return response()->json([
                'status' => 'UNPAID',
                'bill_number' => $khqr->bill_number,
                'is_paid' => false,
                'error' => 'Bakong API token not configured'
            ], 500);
        }

        try {
            $apiUrl = 'https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5';
            $response = \Illuminate\Support\Facades\Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($apiUrl, [
                    'md5' => $md5,
                ]);

            \Log::info('Bakong API response for md5 ' . $md5 . ': ' . $response->body());

            if ($response->successful()) {
                $data = $response->json();
               if (
                    isset($data['responseCode']) && $data['responseCode'] === 0 &&
                    !empty($data['data'])
                ) {
                    // Payment confirmed, update local DB
                    $khqr->status = 'PAID';
                    $khqr->transaction_id = $data['data']['externalRef'] ?? null;
                    $khqr->save();

                    // Auto-create order if not already linked
                    if (!$khqr->order_id) {
                        $this->autoCreateOrder($khqr, $khqr->transaction_id);
                    }

                    // Broadcast payment event for real-time updates
                    broadcast(new \App\Events\BakongPaymentCompleted($khqr, $khqr->transaction_id));

                    return response()->json([
                        'status' => 'PAID',
                        'bill_number' => $khqr->bill_number,
                        'is_paid' => true,
                        'transaction_id' => $khqr->transaction_id,
                    ]);
                }
            }
        } catch (\Exception $e) {
            \Log::error('Bakong API check error: ' . $e->getMessage());
        }

        // Default: still unpaid
        return response()->json([
            'status' => 'UNPAID',
            'bill_number' => $khqr->bill_number,
            'is_paid' => false,
        ]);
    }

    /**
     * Handle Bakong webhook for user orders
     */
    public function handleWebhook(Request $request)
    {
        Log::info('KHQRUserController: Received Bakong webhook', $request->all());

        $billNumber = $request->input('bill_number');
        $status = $request->input('status');
        $md5 = $request->input('md5');
        $transactionId = $request->input('transaction_id') ?? $request->input('externalRef');

        $khqr = KHQR::where('bill_number', $billNumber)->first();
        if (!$khqr) {
            return response()->json(['message' => 'KHQR not found'], 404);
        }

        // Mark as paid if status is PAID
        if ($status === 'PAID') {
            $khqr->status = 'PAID';
            $khqr->transaction_id = $transactionId;
            $khqr->save();

            // Auto-create order if not already linked
            if (!$khqr->order_id) {
                $this->autoCreateOrder($khqr, $transactionId);
                $notificationSent = $this->sendTelegramNotification($order);
            }
        }

        return response()->json(['message' => 'Webhook processed']);
    }

    // Auto Order
    private function autoCreateOrder($khqr, $transactionId = null)
    {
        try {
            // Try to find an existing order with md5_hash
            $existingOrder = \App\Models\Order::where('md5_hash', $khqr->md5)
                ->with('customer', 'items')
                ->first();

            if ($existingOrder) {
                $existingOrder->update([
                    'is_paid' => 1,
                    'payment_method' => 'E-Wallet'
                ]);
                $khqr->order_id = $existingOrder->order_id;
                $khqr->save();

                $invoice = \App\Models\Invoice::where('order_id', $existingOrder->order_id)->first();
                if ($invoice) {
                    $invoice->update(['is_paid' => 1]);
                }
                return $existingOrder;
            }

            // Try to find the most recent unpaid E-Wallet order for the same customer and amount
            $recentUnpaidOrder = \App\Models\Order::where('payment_method', 'E-Wallet')
                ->where('is_paid', 0)
                ->where('total_payment', $khqr->amount)
                ->where('currency', $khqr->currency)
                ->where('created_at', '>=', now()->subHours(2))
                ->with('customer', 'items')
                ->orderBy('created_at', 'desc')
                ->first();

            // $customer = $recentUnpaidOrder ? $recentUnpaidOrder->customer : \App\Models\Customer::latest('created_at')->first();
            // $userId = $recentUnpaidOrder ? $recentUnpaidOrder->user_id : 4; // fallback to user_id 4
            $userId = $khqr->user_id ?? ($recentUnpaidOrder ? $recentUnpaidOrder->user_id : 4);
            $user = $userId ? \App\Models\User::find($userId) : null;

            // Find or create customer for this user
            if ($user) {
                $customer = \App\Models\Customer::where('user_id', $user->id)->first();
                if (!$customer) {
                    $customer = \App\Models\Customer::create([
                        'user_id' => $user->id,
                        'name' => $user->name,
                        'phone' => $user->phone,
                    ]);
                }
            } else if ($recentUnpaidOrder && $recentUnpaidOrder->customer) {
                $customer = $recentUnpaidOrder->customer;
            } else {
                // fallback to latest customer or create guest
                $customer = \App\Models\Customer::latest('created_at')->first();
                if (!$customer) {
                    $customer = \App\Models\Customer::create([
                        'name' => 'Guest',
                        'phone' => null,
                    ]);
                }
            }

            // Create the order
            $orderData = [
                'customer_id' => $customer ? $customer->customer_id : null,
                'user_id' => $userId ?? 4,
                'sub_total' => $khqr->amount,
                'discount' => 0,
                'total' => $khqr->amount,
                'total_payment' => $khqr->amount,
                'currency' => $khqr->currency,
                'is_paid' => 1,
                'payment_method' => 'E-Wallet',
                'md5_hash' => $khqr->md5
            ];

            $order = \App\Models\Order::create($orderData);

            // Copy order items from recent unpaid order if available
            if ($recentUnpaidOrder && $recentUnpaidOrder->items) {
                foreach ($recentUnpaidOrder->items as $item) {
                    $order->items()->create([
                        'product_id' => $item->product_id,
                        'product_title' => $item->product_title,
                        'product_price' => $item->product_price,
                        'quantity' => $item->quantity,
                        'product_color' => $item->product_color,
                    ]);
                }
            }

            // if the order already exists, the Telegram notification is not sent for E-Wallet. so we put this
            if ($existingOrder) {
                $existingOrder->update([
                    'is_paid' => 1,
                    'payment_method' => 'E-Wallet'
                ]);
                $khqr->order_id = $existingOrder->order_id;
                $khqr->save();

                $invoice = \App\Models\Invoice::where('order_id', $existingOrder->order_id)->first();
                if ($invoice) {
                    $invoice->update(['is_paid' => 1]);
                }

                // ADD THIS LINE:
                $this->sendTelegramNotification($existingOrder);

                return $existingOrder;
            }

            // Create invoice
            \App\Models\Invoice::create([
                'order_id' => $order->order_id,
                'customer_id' => $order->customer_id,
                'total_amount' => $order->total_payment,
                'sub_total' => $order->sub_total,
                'is_paid' => 1,
                'currency' => $order->currency,
            ]);

            // Update KHQR
            $khqr->order_id = $order->order_id;
            $khqr->save();

            $customerName = $customer ? $customer->name : 'Guest';
            $productTitle = $order->items()->first()->product_title ?? 'N/A';

            Notification::create([
                'user_id' => $order->user_id, 
                'type' => 'order_created',
                'title' => 'Created Order: #' . $order->order_id,
                'body' => "Order #{$order->order_id} created for {$customerName}",
                'data' => json_encode([
                    'order_id' => $order->order_id,
                    'customer_name' => $customerName,
                    'product_title' => $productTitle,
                    'total' => $order->total_payment,
                    'currency' => $order->currency,
                ]),
                'is_read' => false,
            ]);

            broadcast(new OrderNotification(
                $order->order_id,
                $customerName,
                $order->total_payment,
                $order->currency,
                $productTitle,
                'created'
            ));

            $this->sendTelegramNotification($order);


            return $order;
        } catch (\Exception $e) {
            \Log::error("Auto order creation failed: " . $e->getMessage());
            return null;
        }
    }

    private function sendTelegramNotification($order)
    {
        \Log::info("sendTelegramNotification called for order {$order->order_id}");
        
        try {
            // Load the customer relationship if not already loaded
            if (!$order->relationLoaded('customer')) {
                $order->load('customer');
            }
            
            // Load items relationship if not already loaded
            if (!$order->relationLoaded('items')) {
                $order->load('items');
            }
            
            // Try to find Telegram config for the order creator
            $telegram = Telegram::where('user_id', $order->user_id)->first();
            \Log::info("Looking for Telegram config for user {$order->user_id}");
            
            // If no telegram config for this user, try to find any configured telegram bot
            if (!$telegram) {
                \Log::warning("Telegram chat ID not found for user {$order->user_id}, trying to find any active bot");
                $telegram =  Telegram::whereNotNull('chatBotID')->first();
                
                if (!$telegram) {
                    \Log::warning("No Telegram bots configured in the system");
                    return false;
                }
                \Log::info("Found fallback Telegram bot for user {$telegram->user_id}");
            } else {
                \Log::info("Found Telegram config for user {$order->user_id}");
            }

            $telegramToken = config('services.telegram.bot_token') ?? env('TELEGRAM_BOT_TOKEN');
            if (!$telegramToken) {
                \Log::warning("Telegram bot token not configured");
                return false;
            }
            
            $telegramApiUrl = "https://api.telegram.org/bot{$telegramToken}/sendMessage";

            // Get order date and format amount
            $orderDate = $order->created_at
                ? $order->created_at->format('Y-m-d H:i:s')
                : now()->format('Y-m-d H:i:s');

            $amountDisplay = $order->currency === 'KHR'
                ? number_format($order->total_payment * 4000, 0) . ' ៛'
                : '$' . number_format($order->total_payment, 2);
            
            $message = "===============================\n";
            
            // Create different message based on payment method
            if ($order->payment_method === 'Cash') {
                $message .= "💵 <b>Cash Payment Received!</b>\n";
            } elseif ($order->payment_method === 'E-Wallet') {
                $message .= "🎉 <b>KHQR E-Wallet Payment Received!</b>\n";
                
                // Add transaction ID if available
                $khqr = KHQR::where('order_id', $order->order_id)->first();
                if ($khqr && $khqr->transaction_id) {
                    $message .= "🔢 <b>Transaction ID:</b> {$khqr->transaction_id}\n";
                }
            } else {
                $message .= "🎉 <b>Payment Received!</b>\n";
            }
            
            $message .= "===============================\n";
            $message .= "📋 <b>លេខបញ្ជាទិញ:</b> {$order->order_id}\n";
            $message .= "📅 <b>កាលបរិច្ឆេទ:</b> {$orderDate}\n";
            
            // Add customer info if available
            if ($order->customer) {
                $message .= "👤 <b>អតិថិជន:</b> {$order->customer->name}\n";
                if ($order->customer->phone) {
                    $message .= "📱 <b>Phone:</b> {$order->customer->phone}\n";
                }
            }
            // Add order items if available
            if ($order->items && $order->items->count() > 0) {
                $message .= "📦 <b>Items:</b>\n";
                foreach ($order->items as $item) {
                    $itemPrice = $order->currency === 'KHR'
                        ? number_format($item->product_price * 4000, 0) . ' ៛'
                        : '$' . number_format($item->product_price, 2);
                    
                    $message .= "   • {$item->product_title} x{$item->quantity} ({$itemPrice})\n";
                }
            }
            

            $message .= "💰 <b>ចំនួនទឹកប្រាក់:</b> {$amountDisplay}\n";
            $message .= "📌 <b>ស្ថានភាព:</b> PAID ✅\n";
            
            // Display correct payment method
            if ($order->payment_method === 'Cash') {
                $message .= "💵 <b>payment_method:</b> Cash\n";
            } else {
                $message .= "💳 <b>payment_method:</b> KHQR E-Wallet\n";
            }
            
            $message .= "===============================\n";
            
            // Display appropriate footer based on payment method
            if ($order->payment_method === 'Cash') {
                $message .= "<i>Cash payment processed successfully</i>";
            } else {
                $message .= "<i>Payment processed automatically via KHQR</i>";
            }

            $response = Http::withOptions(['verify' => false])->post($telegramApiUrl, [
                'chat_id' => $telegram->chatBotID,
                'text' => $message,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ]);

            if ($response->successful()) {
                \Log::info("Telegram notification sent successfully for order {$order->order_id}");
                return true;
            } else {
                \Log::error("Failed to send Telegram notification for order {$order->order_id}: " . $response->body());
                return false;
            }
            
        } catch (\Exception $e) {
            \Log::error("Exception when sending Telegram notification for order {$order->order_id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Build EMV-compliant KHQR payload string
     */
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