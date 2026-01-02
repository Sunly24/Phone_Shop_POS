<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItems;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\KHQR;
use App\Models\Telegram;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Traits\SendsTelegramNotification;
use App\Events\OrderNotification;
use App\Models\Notification;
use App\Events\ProductStockUpdated;

class PublicOrderController extends Controller
{
    use SendsTelegramNotification;

    public function store(Request $request)
    {
        $user = Auth::user();

        // Validate items and currency for all
        $validated = $request->validate([
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity'   => 'required|integer|min:1',
            'currency'           => 'required|string|in:USD,KHR',
            'md5_hash'           => 'required_if:payment_method,E-Wallet|string|nullable',
            'payment_method'     => 'required|string|in:Cash,E-Wallet',
            'is_paid'            => 'boolean',
        ]);

        $isPaid = $request->input('is_paid', false);

        // If user is not logged in, validate customer info
        if (!$user) {
            $request->validate([
                'customer_name'    => 'required|string|max:255',
                'customer_phone'   => 'nullable|string|max:50',
            ]);
            $customerName = $request->customer_name;
            $customerPhone = $request->customer_phone;
            $customerAddress = $request->customer_address;
        } else {
            $customerName = $user->name;
            $customerPhone = $user->phone ?? null;
        }

        // If cash, always mark as paid
        if ($validated['payment_method'] === 'Cash') {
            $isPaid = true;
            \Log::info('Cash order: setting is_paid to true');
        }

        DB::beginTransaction();
        try {
            // Create or update customer
            $customer = Customer::updateOrCreate(
                ['name' => $customerName],
                [
                    'phone'   => $customerPhone,
                ]
            );

            // Calculate totals
            $subTotal = 0;
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $subTotal += $product->product_price * $item['quantity'];
            }
            $discount = 0;
            $total = $subTotal - $discount;

            // Create order
            $order = Order::create([
                'customer_id'    => $customer->customer_id,
                'sub_total'      => $subTotal,
                'discount'       => $discount,
                'total'          => $total,
                'total_payment'  => $total,
                'currency'       => $validated['currency'],
                'is_paid'        => $isPaid,
                'payment_method' => $request->input('payment_method', 'Cash'),
                'user_id' => $user ? $user->id : ($request->input('user_id') ?? null),
                'md5_hash'       => $request->input('md5_hash'),
            ]);

            \Log::info('Order created', [
                'order_id' => $order->order_id,
                'is_paid' => $order->is_paid,
                'payment_method' => $order->payment_method
            ]);

            $billNumber = $request->input('bill_number');
            if ($billNumber) {
                $khqr = KHQR::where('bill_number', $billNumber)->first();
                if ($khqr) {
                    $khqr->order_id = $order->order_id;
                    $khqr->status = $isPaid ? 'PAID' : $khqr->status;
                    $khqr->save();
                }
            }

            if ($validated['payment_method'] === 'E-Wallet' && !empty($validated['md5_hash'])) {
                $khqr = KHQR::where('md5', $validated['md5_hash'])->first();
                if ($khqr) {
                    $khqr->order_id = $order->order_id;
                    if ($khqr->status === 'PAID') {
                        $order->update(['is_paid' => true]);
                        if ($khqr->transaction_id) {
                            $order->transaction_id = $khqr->transaction_id;
                            $order->save();
                        }
                    }
                    $khqr->save();
                    \Log::info("Linked KHQR to order", [
                        'order_id' => $order->order_id,
                        'md5' => $validated['md5_hash']
                    ]);
                }
            }

            // Attach order items
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $order->items()->create([
                    'product_id'    => $product->product_id,
                    'product_code'  => $product->product_code,
                    'product_title' => $product->product_title,
                    'product_price' => $product->product_price,
                    'quantity'      => $item['quantity'],
                    'product_ram'   => $product->product_ram ?? 'N/A',
                    'product_color' => $product->color?->color_title,
                ]);
                $product->decrement('product_stock', $item['quantity']);
                // Broadcast real-time update
                broadcast(new ProductStockUpdated($product->product_id, $product->product_stock));
            }

            // Create invoice
            $invoice = Invoice::create([
                'order_id'     => $order->order_id,
                'customer_id'  => $customer->customer_id,
                'sub_total'    => $subTotal,
                'total_amount' => $total,
                'currency'     => $validated['currency'],
                'is_paid'      => $isPaid,
                'user_id'      => $user ? $user->id : null,
            ]);

            DB::commit();

            // === Send Telegram message for Cash orders ===
            if ($order->payment_method === 'Cash' && $order->is_paid) {
                $orderDate = $order->created_at ? $order->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                $amountDisplay = $order->currency === 'KHR'
                    ? number_format($order->total_payment * 4000, 0) . ' ៛'
                    : '$' . number_format($order->total_payment, 2);

                $message = "===============================\n";
                $message .= "💵 <b>Cash Payment Received!</b>\n";
                $message .= "===============================\n";
                $message .= "📋 <b>លេខបញ្ជាទិញ:</b> {$order->order_id}\n";
                $message .= "📅 <b>កាលបរិច្ឆេទ:</b> {$orderDate}\n";
                $message .= "👤 <b>អតិថិជន:</b> {$customerName}\n";
                if (!empty($customerPhone)) {
                    $message .= "📱 <b>ទូរស័ព្ទ:</b> {$customerPhone}\n";
                }
                if (!empty($customerAddress)) {
                    $message .= "🏠 <b>អាសយដ្ឋាន:</b> {$customerAddress}\n";
                }
                $message .= "📦 <b>ទំនិញ:</b>\n";
                foreach ($order->items as $item) {
                    $priceDisplay = $order->currency === 'KHR'
                        ? number_format($item->product_price * 4000, 0) . ' ៛'
                        : '$' . number_format($item->product_price, 2);
                    $color = $item->product_color ?? 'N/A';
                    $ram = $item->product_ram ?? 'N/A';
                    $message .= "   • {$item->product_title} x{$item->quantity} ({$priceDisplay})\n";
                    $message .= "     - Color: {$color} | RAM: {$ram}\n";
                }
                $message .= "💰 <b>ចំនួនទឹកប្រាក់:</b> {$amountDisplay}\n";
                $message .= "📌 <b>ស្ថានភាព:</b> PAID ✅\n";
                $message .= "💵 <b>វិធីសាស្រ្តបង់ប្រាក់:</b> Cash\n";
                $message .= "===============================\n";
                $message .= "<i>Cash payment processed successfully</i>";

                // Now send the message
                $anyTelegram = Telegram::whereNotNull('chatBotID')->first();
                if ($anyTelegram && $anyTelegram->chatBotID) {
                    $this->sendTelegramNotification($anyTelegram->chatBotID, $message);
                    \Log::info('Telegram message sent for cash order', [
                        'order_id' => $order->order_id,
                        'chatBotID' => $anyTelegram->chatBotID
                    ]);
                } else {
                    \Log::warning('No Telegram bot found for cash order notification');
                }
            }

            // === Send Telegram message for E-Wallet (KHQR) orders ===
            if ($order->payment_method === 'E-Wallet' && $order->is_paid) {
                $orderDate = $order->created_at ? $order->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                $amountDisplay = $order->currency === 'KHR'
                    ? number_format($order->total_payment * 4000, 0) . ' ៛'
                    : '$' . number_format($order->total_payment, 2);

                $message = "===============================\n";
                $message .= "🎉 <b>KHQR E-Wallet Payment Received!</b>\n";
                $message .= "===============================\n";
                $message .= "📋 <b>លេខបញ្ជាទិញ:</b> {$order->order_id}\n";
                $message .= "📅 <b>កាលបរិច្ឆេទ:</b> {$orderDate}\n";
                $message .= "👤 <b>អតិថិជន:</b> {$customerName}\n";
                if (!empty($customerPhone)) {
                    $message .= "📱 <b>ទូរស័ព្ទ:</b> {$customerPhone}\n";
                }
                if (!empty($customerAddress)) {
                    $message .= "🏠 <b>អាសយដ្ឋាន:</b> {$customerAddress}\n";
                }
                $message .= "📦 <b>ទំនិញ:</b>\n";
                foreach ($order->items as $item) {
                    $priceDisplay = $order->currency === 'KHR'
                        ? number_format($item->product_price * 4000, 0) . ' ៛'
                        : '$' . number_format($item->product_price, 2);
                    $color = $item->product_color ?? 'N/A';
                    $ram = $item->product_ram ?? 'N/A';
                    $message .= "   • {$item->product_title} x{$item->quantity} ({$priceDisplay})\n";
                    $message .= "     - Color: {$color} | RAM: {$ram}\n";
                }
                $message .= "💰 <b>ចំនួនទឹកប្រាក់:</b> {$amountDisplay}\n";
                $message .= "📌 <b>ស្ថានភាព:</b> PAID ✅\n";
                $message .= "💳 <b>វិធីសាស្រ្តបង់ប្រាក់:</b> KHQR E-Wallet\n";
                $message .= "===============================\n";
                $message .= "<i>Payment processed automatically via KHQR</i>";

                $anyTelegram = Telegram::whereNotNull('chatBotID')->first();
                if ($anyTelegram && $anyTelegram->user_id) {
                    $this->sendTelegramNotification($anyTelegram->user_id, $message);
                }
            }



            // Notification real time
            $firstItem = $order->items()->first();
            $productTitle = $firstItem ? $firstItem->product_title : 'Phone';

            // Use the user's name if available, otherwise fallback
            $username = $user ? $user->name : ($customerName ?? 'Guest');

            // Broadcast real-time notification for staff/admin dashboard
            broadcast(new OrderNotification(
                $order->order_id,   
                $customerName,
                $order->total_payment,
                $order->currency,
                $username,
                $productTitle,
                'created'
            ));

            Notification::create([
                'user_id' => $user ? $user->id : null, 
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

            return response()->json([
                'success'    => true,
                'order_id'   => $order->order_id,
                'invoice_id' => $invoice->invoice_id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    } 
    
    public function sendTelegramNotification($chatId, $message)
    {
        try {
            $token = env('TELEGRAM_BOT_TOKEN');
            $url = "https://api.telegram.org/bot{$token}/sendMessage";
            $response = \Http::post($url, [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
            ]);
            \Log::info('Telegram notification sent', ['chat_id' => $chatId, 'response' => $response->body()]);
            return true;
        } catch (\Exception $e) {
            \Log::error('Telegram send error', ['error' => $e->getMessage()]);
            return false;
        }
    }
}