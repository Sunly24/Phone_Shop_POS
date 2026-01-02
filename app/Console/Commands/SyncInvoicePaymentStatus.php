<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Invoice;
use App\Models\KHQR;
use Illuminate\Support\Facades\Log;

class SyncInvoicePaymentStatus extends Command
{
    protected $signature = 'invoice:sync-payment-status';
    protected $description = 'Sync invoice payment status with order payment status and fix E-Wallet payments';

    public function handle()
    {
        $this->info('Starting payment status synchronization...');
        
        // Part 1: Fix E-Wallet orders that should be marked as paid based on KHQR status
        $this->info('Checking E-Wallet orders...');
        $ewalletOrders = Order::where('payment_method', 'E-Wallet')
            ->where('is_paid', 0)
            ->whereNotNull('md5_hash')
            ->get();
            
        $ewalletFixed = 0;
        
        foreach ($ewalletOrders as $order) {
            $khqr = KHQR::where('md5', $order->md5_hash)->first();
            
            if ($khqr && $khqr->status === 'PAID') {
                // Update order to paid
                $order->update(['is_paid' => 1]);
                $ewalletFixed++;
                $this->info("Fixed E-Wallet order {$order->order_id} - marked as paid based on KHQR status");
                Log::info("Fixed E-Wallet order {$order->order_id} - marked as paid based on KHQR status");
                
                // Update invoice too
                if ($order->invoice) {
                    $order->invoice->update(['is_paid' => 1]);
                    $this->info("Updated invoice {$order->invoice->invoice_id} for E-Wallet order {$order->order_id}");
                    Log::info("Updated invoice {$order->invoice->invoice_id} for E-Wallet order {$order->order_id}");
                }
            }
        }
        
        // Part 2: Sync KHQR order_id for records that don't have it
        $this->info('Syncing KHQR order_id...');
        $khqrSynced = 0;
        $ordersWithMd5 = Order::whereNotNull('md5_hash')->get();
        
        foreach ($ordersWithMd5 as $order) {
            $khqr = KHQR::where('md5', $order->md5_hash)->first();
            
            if ($khqr && !$khqr->order_id) {
                $khqr->update(['order_id' => $order->order_id]);
                $khqrSynced++;
                $this->info("Linked KHQR record {$khqr->bill_number} to order {$order->order_id}");
                Log::info("Linked KHQR record {$khqr->bill_number} to order {$order->order_id}");
            }
        }
        
        // Part 3: Get all orders that are paid but have unpaid invoices
        $this->info('Syncing invoice payment status...');
        $orders = Order::where('is_paid', 1)
            ->whereHas('invoice', function ($query) {
                $query->where('is_paid', 0);
            })
            ->with('invoice')
            ->get();
            
        $invoiceSynced = 0;
        
        foreach ($orders as $order) {
            if ($order->invoice) {
                $order->invoice->update(['is_paid' => 1]);
                $invoiceSynced++;
                $this->info("Synced invoice {$order->invoice->invoice_id} for order {$order->order_id}");
                Log::info("Synced invoice {$order->invoice->invoice_id} payment status for order {$order->order_id}");
            }
        }
        
        $this->info("Synchronization completed. Summary:");
        $this->info("- {$ewalletFixed} E-Wallet orders fixed and marked as paid");
        $this->info("- {$khqrSynced} KHQR records linked to orders");
        $this->info("- {$invoiceSynced} invoices synced with order payment status");
        
        return 0;
    }
}
