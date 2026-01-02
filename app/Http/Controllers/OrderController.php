<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use App\Models\Category;
use App\Models\Order;
use App\Models\Invoice;
use App\Models\Color;
use App\Models\Inventory;
use App\Models\OrderItems;
use App\Models\KHQR;
use App\Models\Telegram;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Events\OrderNotification;
use App\Models\Notification;
use App\Exports\OrderExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class OrderController extends Controller
{
    public function __construct()
    {
        $this->telegramToken = env('TELEGRAM_BOT_TOKEN');
    }

    /**
     * Display paginated list of orders with search filter.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        $query = Order::with('customer', 'items.product');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                ->orWhereHas('customer', function($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                });
            });
        }

        $orders = $query
            ->orderBy('order_id', 'asc')
            ->paginate($perPage)
            ->appends($request->only('search', 'per_page'));

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Show order create/edit form with products, categories, customers.
     */
    public function create(Request $request)
    {
        $search = $request->input('search', '');

        return Inertia::render('Orders/CreateEdit', [
            'order' => new Order(),
            'customers' => Customer::orderBy('name')->get(['customer_id', 'name']),
            'products' => Product::with('category', 'images', 'color') 
                ->orderBy('product_title')
                ->get(['product_id', 'product_title', 'product_price', 'category_id', 'product_stock', 'product_ram', 'color_id']),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'colors' => Color::orderBy('color_title')->get(['color_id', 'color_title']), 
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Send Telegram message helper.
     */
    private function sendTelegramMessage(int $userId, string $message): bool
    {
        try {
            $telegram = Telegram::where('user_id', $userId)->first();
            
            // If no telegram config for this user, try to find any configured telegram bot
            if (!$telegram) {
                Log::warning("Telegram chat ID not found for user {$userId}, trying to find any active bot");
                $telegram = Telegram::whereNotNull('chatBotID')->first();
                
                if (!$telegram) {
                    Log::warning("No Telegram bots configured in the system");
                    return false;
                }
            }

            $telegramToken = config('services.telegram.bot_token');
            if (!$telegramToken) {
                Log::warning("Telegram bot token not configured");
                return false;
            }
            
            $telegramApiUrl = "https://api.telegram.org/bot{$telegramToken}/sendMessage";

            $response = Http::withOptions(['verify' => false])->post($telegramApiUrl, [
                'chat_id' => $telegram->chatBotID,
                'text' => $message,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ]);

            if ($response->successful()) {
                Log::info("Telegram message sent successfully for order notification");
                return true;
            } else {
                Log::error("Failed to send Telegram message: " . $response->body());
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Failed to send Telegram message: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Store new order.
     */
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
             $validated = $request->validate([
                'customer_name'    => 'required|string|max:255',
                'customer_phone'   => 'nullable|string|max:50',
                'customer_address' => 'nullable|string|max:500',
                'sub_total'        => 'required|numeric',
                'discount'         => 'nullable|numeric',
                'total'            => 'required|numeric',  
                'total_payment'    => 'required|numeric',
                'currency'         => 'required|string|in:USD,KHR',
                'is_paid'          => 'required|boolean',
                'items'            => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,product_id',
                'items.*.quantity'   => 'required|integer|min:1',
                'md5_hash'         => 'nullable|string',
                'payment_method'   => 'required|string|in:Cash,E-Wallet',
            ]);

            Log::info('Validated data for new order:', $validated);

            // Create or update customer record
            $customer = Customer::updateOrCreate(
                ['name' => $validated['customer_name']],
                [
                    'phone'   => $validated['customer_phone'] ?? null,
                    'address' => $validated['customer_address'] ?? null,
                ]
            );

            $isPaid = $validated['is_paid'];
            $md5Hash = $validated['md5_hash'] ?? null;
            $paymentMethod = $validated['payment_method'];
            
            Log::info("Processing order with payment method: {$paymentMethod}");
            
            // Verify KHQR status if it's E-Wallet payment
            if (!empty($md5Hash) && !$isPaid) {
                Log::info("Verifying KHQR payment status for MD5: {$md5Hash}");
                $paymentStatus = $this->verifyPaymentStatus($md5Hash);
                if ($paymentStatus === 'PAID') {
                    $isPaid = true;
                    Log::info("KHQR payment verified as PAID for MD5: {$md5Hash}");
                }
            } elseif (empty($md5Hash) && $isPaid) {
                Log::info("Processing cash payment - marking as paid");
            }

            // Create order
            $order = Order::create([
                'customer_id'    => $customer->customer_id,
                'sub_total'      => $validated['sub_total'],
                'discount'       => $validated['discount'] ?? 0,
                'total'          => $validated['total'],
                'total_payment'  => $validated['total_payment'],
                'currency'       => $validated['currency'],
                'md5_hash'       => $md5Hash,
                'is_paid'        => $isPaid,
                'payment_method' => $paymentMethod,
                'user_id'        => Auth::id(),
            ]);

            Log::info("Created order {$order->order_id} with is_paid={$isPaid}, payment_method={$paymentMethod}");

            // if ($md5Hash) {
            //     $khqr = KHQR::where('md5', $md5Hash)->first();
            //     if ($khqr) {
            //         // Check if KHQR is already paid in our database
            //         if ($khqr->status === 'PAID' && !$isPaid) {
            //             // Update the order to reflect the payment status from KHQR
            //             $isPaid = true;
            //             $order->update(['is_paid' => true]);
            //             Log::info("Updated order is_paid status to match KHQR payment status for order {$order->order_id}");
            //         }
                    
            //         // Update the KHQR record with order_id
            //         $khqr->order_id = $order->order_id;
            //         $khqr->status = $isPaid ? 'PAID' : $khqr->status;
            //         $khqr->save();
            //         Log::info("Updated KHQR record with order_id: {$order->order_id} for MD5: {$md5Hash}");
            //     }
            // }
            if ($md5Hash) {
                $khqr = KHQR::where('md5', $md5Hash)->first();
                if ($khqr) {
                    $khqr->order_id = $order->order_id;
                    $khqr->save();
                    Log::info("Linked KHQR to staff order", [
                        'order_id' => $order->order_id,
                        'md5' => $md5Hash
                    ]);
                }
            }
        
            // Get first product title for notification (before creating items)
            $firstItemData = $validated['items'][0] ?? null;
            $firstProduct = null;
            $productTitle = 'Phone';
            if ($firstItemData) {
                $firstProduct = Product::find($firstItemData['product_id']);
                if ($firstProduct) {
                    $productTitle = $firstProduct->product_title;
                }
            }

            // Attach order items and decrement stock
            foreach ($validated['items'] as $itemData) {
                $product = Product::with('color')->findOrFail($itemData['product_id']);

                if ($product->product_stock < $itemData['quantity']) {
                    DB::rollBack();
                    return redirect()->back()->withErrors([
                        'error' => "Product '{$product->product_title}' is out of stock or not enough quantity."
                    ]);
                }

                $order->items()->create([
                    'product_id'    => $product->product_id,
                    'product_code'  => $product->product_code,
                    'product_title' => $product->product_title,
                    'product_price' => $product->product_price,
                    'quantity'      => $itemData['quantity'], 
                    'product_ram'   => $product->product_ram ?? 'N/A',  
                    'product_color' => $product->color?->color_title,    
                ]);

                // Update inventory for this specific product only
                $inventory = Inventory::where('product_id', $product->product_id)->first();
                if ($inventory) {
                    $booked = OrderItems::where('product_id', $product->product_id)->sum('quantity');
                    Log::info("Updating inventory for product ID {$product->product_id}, Quantity booked: {$booked}");
                    $inventory->update(['quantity_booked' => $booked]); 
                    Log::info("Updated inventory: ", $inventory->toArray());
                    $inventory->decrement('product_stock', $itemData['quantity']);  
                }

                $product->decrement('product_stock', $itemData['quantity']);
            }

            // Calculate subtotal to store in invoice
            $subtotal = collect($validated['items'])->sum(function ($item) {
                $product = Product::findOrFail($item['product_id']);
                return $product->product_price * $item['quantity'];
            });            // Create invoice record
            $invoice = Invoice::create([
                'order_id'     => $order->order_id,
                'customer_id'  => $customer->customer_id,
                'sub_total'    => $subtotal,
                'total_amount' => $validated['total_payment'],
                'currency'     => $validated['currency'],
                'is_paid'      => $isPaid,
                'user_id'      => Auth::id(),
            ]);

            // Link KHQR record if exists
            if ($md5Hash) {
                $khqr = \App\Models\KHQR::where('md5', $md5Hash)->first();
                if ($khqr) {
                    $khqr->order_id = $order->order_id;
                    if ($isPaid) {
                        $khqr->status = 'PAID';
                    }
                    $khqr->save();
                }
            }

            $order->load('items');

            // Send Telegram notification if paid
            if ($isPaid) {
                $orderDate = $order->created_at
                    ? $order->created_at->format('Y-m-d H:i:s')
                    : now()->format('Y-m-d H:i:s');

                $amountDisplay = $order->currency === 'KHR'
                    ? number_format($order->total_payment * 4000, 0) . ' ៛'
                    : '$' . number_format($order->total_payment, 2);
                $message = "===============================\n";
                
                // Create different message based on payment method
                if ($validated['payment_method'] === 'Cash') {
                    $message .= "💵 <b>Cash Payment Received!</b>\n";
                } else {
                    $message .= "🎉 <b>KHQR Payment Received!</b>\n";
                }
                
                $message .= "===============================\n";
                $message .= "📋 <b>លេខបញ្ជាទិញ:</b> {$order->order_id}\n";
                $message .= "📅 <b>កាលបរិច្ឆេទ:</b> {$orderDate}\n";
                $message .= "👤 <b>អតិថិជន:</b> {$validated['customer_name']}\n";
                if (!empty($user) && !empty($user->name)) {
                    $message .= " by {$user->name}";
                }
                $message .= "\n";

                if (!empty($validated['customer_phone'])) {
                    $message .= "📱 <b>ទូរស័ព្ទ:</b> {$validated['customer_phone']}\n";
                }
                if (!empty($validated['customer_address'])) {
                    $message .= "🏠 <b>អាសយដ្ឋាន:</b> {$validated['customer_address']}\n";
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
                
                // Display correct payment method
                if ($validated['payment_method'] === 'Cash') {
                    $message .= "💵 <b>វិធីសាស្រ្តបង់ប្រាក់:</b> Cash\n";
                } else {
                    $message .= "💳 <b>payment_method:</b> KHQR E-Wallet\n";
                }
                
                $message .= "===============================\n";
                
                // Display appropriate footer
                if ($validated['payment_method'] === 'Cash') {
                    $message .= "<i>Cash payment processed successfully</i>";
                } else {
                    $message .= "<i>Payment processed via KHQR</i>";
                }

                // Try to send to current user first, then any user with Telegram configured
                if (!$this->sendTelegramMessage(Auth::id(), $message)) {
                    // If sending to current user fails, try sending to any user with Telegram configured
                    $anyTelegram = Telegram::whereNotNull('chatBotID')->first();
                    if ($anyTelegram && $anyTelegram->user_id) {
                        $this->sendTelegramMessage($anyTelegram->user_id, $message);
                    }
                }
            }

            // Create notification in database
            $currentUser = Auth::user();
            $username = $currentUser ? $currentUser->name : 'System';
            
            // Create database notification
            Notification::createOrderNotification(
                $order->order_id,
                $validated['customer_name'],
                $validated['total_payment'],
                $username,
                Auth::id(),
                $productTitle,
                $validated['currency']
            );

            // Broadcast real-time notification
            broadcast(new OrderNotification(
                $order->order_id,
                $validated['customer_name'],
                $validated['total_payment'],
                $validated['currency'],
                $username,
                $productTitle,
                'created'
            ));

            DB::commit();

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'order_id' => $order->order_id,
                    'invoice_id' => $invoice->invoice_id,
                ]);
            }


            return Inertia::render('Orders/CreateEdit', [
                'order' => $order,
                'products' => Product::with('category', 'images')
                                    ->orderBy('product_title')
                                    ->get(['product_id', 'product_title', 'product_price', 'category_id', 'product_ram', 'color_id']),
                'categories' => Category::orderBy('name')->get(['id', 'name']),
                'filters' => ['search' => ''],
                'success' => true,
                'invoice_id' => $invoice->invoice_id,
                'customers' => Customer::orderBy('name')->get(['customer_id', 'name']),

            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order creation failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to create order: ' . $e->getMessage()]);
        }
    }

    /**
     * Update existing order.
     */
    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $validated = $request->validate([
                'customer_name' => 'required|string|max:255',
                'sub_total' => 'required|numeric',
                'discount' => 'nullable|numeric',
                'total' => 'required|numeric',
                'total_payment' => 'required|numeric',
                'currency' => 'required|string|in:USD,KHR',
                'is_paid' => 'required|boolean',
                'payment_method' => 'required|string|in:Cash,E-Wallet',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,product_id',
                'items.*.quantity' => 'required|integer|min:1',
                'md5_hash' => 'nullable|string',
            ]);

            Log::info('Validated update data:', $validated);

            $order = Order::findOrFail($id);
            $customer = Customer::updateOrCreate(
                ['name' => $validated['customer_name']],
                [
                    'phone' => $request->input('customer_phone'),
                    'address' => $request->input('customer_address'),
                ]
            );

            $isPaid = $validated['is_paid'];
            $md5Hash = $validated['md5_hash'] ?? null;

            // Verify payment status from KHQR API if not paid yet
            if ($validated['currency'] && $md5Hash && !$isPaid) {
                $paymentStatus = $this->verifyPaymentStatus($md5Hash);
                if ($paymentStatus === 'PAID') {
                    $isPaid = true;
                }
            }

            // Restore stock from old order items before deleting
            foreach ($order->items as $oldItem) {
                $product = Product::find($oldItem->product_id);
                if ($product) {
                    $product->increment('product_stock', $oldItem->quantity);
                }
            }

            $order->items()->delete();

            // Attach new items and decrement stock
            foreach ($validated['items'] as $itemData) {
                $product = Product::with('color')->findOrFail($itemData['product_id']);

                if ($product->product_stock < $itemData['quantity']) {
                    DB::rollBack();
                    return redirect()->back()->withErrors([
                        'error' => "Product '{$product->product_title}' is out of stock or not enough quantity."
                    ]);
                }

                $order->items()->create([
                    'product_id'    => $product->product_id,
                    'product_code'  => $product->product_code,
                    'product_title' => $product->product_title,
                    'product_price' => $product->product_price,
                    'quantity'      => $itemData['quantity'],
                    'product_color' => $product->color?->color_title, 
                    'product_ram'   => $product->product_ram,   
                ]);

                $product->decrement('product_stock', $itemData['quantity']);
            }

            $order->update([
                'customer_id'   => $customer->customer_id,
                'sub_total'     => $validated['sub_total'],
                'discount'      => $validated['discount'] ?? 0,
                'total'         => $validated['total'],
                'total_payment' => $validated['total_payment'],
                'currency'      => $validated['currency'],
                'md5_hash'      => $md5Hash,
                'is_paid'       => $isPaid,
                'user_id'       => Auth::id(),
            ]);

            $subtotal = collect($validated['items'])->sum(function ($item) {
                $product = Product::findOrFail($item['product_id']);
                return $product->product_price * $item['quantity'];
            });            $invoice = Invoice::where('order_id', $order->order_id)->first();
            if ($invoice) {
                $invoice->update([
                    'sub_total'    => $subtotal,
                    'total_amount' => $validated['total_payment'],
                    'currency'     => $validated['currency'],
                    'is_paid'      => $isPaid,
                    'user_id'      => Auth::id(),
                ]);
            }

            DB::commit();

            return Inertia::render('Orders/CreateEdit', [
                'order' => $order,
                'invoice_id' => $invoice->invoice_id,
                'success' => true,
                'products' => Product::with('category', 'images')
                    ->orderBy('product_title')
                    ->get(['product_id', 'product_title', 'product_price', 'category_id', 'product_stock', 'product_ram', 'color_id']),
                'categories' => Category::orderBy('name')->get(['id', 'name']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order update failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to update order: ' . $e->getMessage()]);
        }
    }   

    /**
     * Verify payment status by MD5 hash via KHQR API.
     */
    private function verifyPaymentStatus(string $md5Hash): ?string
    {
        try {
            Log::info("Verifying payment status for hash: {$md5Hash}");
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.khqr.token'),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->timeout(30)->post(config('services.khqr.endpoint'), [
                'hash' => $md5Hash,
            ]);

            if (!$response->successful()) {
                Log::error("KHQR API request failed with status: " . $response->status());
                Log::error("KHQR API response: " . $response->body());
                return null;
            }

            $data = $response->json();
            Log::info("KHQR API response for hash {$md5Hash}:", $data);

            $paymentStatus = $data['payment_status'] ?? $data['status'] ?? null;
            
            // Update local KHQR record if payment is confirmed
            if ($paymentStatus === 'PAID' || $paymentStatus === 'SUCCESS') {
                $khqr = KHQR::where('md5', $md5Hash)->first();
                if ($khqr && $khqr->status !== 'PAID') {
                    $khqr->update(['status' => 'PAID']);
                    Log::info("Updated KHQR record status to PAID for hash: {$md5Hash}");
                }
            }

            return $paymentStatus;
        } catch (\Exception $e) {
            Log::error("Failed to verify payment status for hash {$md5Hash}: " . $e->getMessage());
            Log::error("Exception stack trace: " . $e->getTraceAsString());
            return null;
        }
    }

    /**
     * Delete order and restore stock.
     */
    public function destroy($id)
    {
        try {
            $order = Order::with('customer', 'items.product')->findOrFail($id);
            
            // Store order data before deletion for broadcasting
            $customerName = $order->customer->name ?? 'Unknown Customer';
            $totalPayment = $order->total_payment;
            $currency = $order->currency ?? 'USD';
            
            // Get product titles from order items
            $productTitles = $order->items->pluck('product.product_title')->implode(', ');
            $productTitle = $productTitles ?: 'No Products';

            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->increment('product_stock', $item->quantity);
                }
            }

            $order->delete();

            // Get current user
            $currentUser = Auth::user();
            $username = $currentUser ? $currentUser->name : 'System';

            // Create notification in database
            Notification::createOrderNotification(
                $id,
                $customerName,
                $totalPayment,
                $username,
                Auth::id(),
                $productTitle,
                $currency,
                'deleted'
            );

            // Broadcast real-time notification
            broadcast(new OrderNotification(
                $id,
                $customerName,
                $totalPayment,
                $currency,
                $username,
                $productTitle,
                'deleted'
            ));            return redirect()->route('orders.index')->with('success', 'Order deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Order deletion failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to delete order: ' . $e->getMessage()]);
        }
    }

    /**
     * Export orders as Excel or PDF
     */    
    public function export($format, Request $request)
    {
        $query = Order::with(['customer', 'items.product']);
        
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('order_id', 'like', "%{$search}%")
                ->orWhereHas('customer', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
        }
        
        $orders = $query->orderBy('order_id', 'asc')->get();
        
        // Format the data for export
        $formattedOrders = $orders->map(function($order) {
            $productTitles = $order->items->map(function($item) {
                return $item->product->product_title;
            })->join(', ');
            
            return [
                'id' => $order->order_id,
                'customer' => $order->customer ? $order->customer->name : 'N/A',
                'items' => $productTitles,
                'subtotal' => $order->currency === 'KHR' ? number_format($order->sub_total * 4000) . ' ៛' : '$' . number_format($order->sub_total, 2),
                'discount' => $order->discount . '%',
                'total' => $order->currency === 'KHR' ? number_format($order->total_payment * 4000) . ' ៛' : '$' . number_format($order->total_payment, 2),
                'status' => $order->total_payment > 0 ? 'Paid' : 'Unpaid',
                'date' => Carbon::parse($order->created_at)->format('Y-m-d H:i'),
            ];
        })->toArray();
        if ($format === 'excel') {
            return Excel::download(new OrderExport(collect($formattedOrders)), 'orders_list.xlsx');
        } elseif ($format === 'pdf') {
            $pdf = Pdf::loadView('exports.orders_pdf', [
                'orders' => $formattedOrders
            ]);
            return $pdf->download('orders_list.pdf');
        }
        
        return redirect()->back()->withErrors('Invalid export format');
    }
}
