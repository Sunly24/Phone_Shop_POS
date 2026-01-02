<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceOrder;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceOrderController extends Controller
{
    /**
     * Display a listing of the invoice orders.
     */
    public function index(Request $request): Response
    {
        // Fetch InvoiceOrders with related Invoice and Order data
        $invoiceOrders = InvoiceOrder::with(['invoice.customer', 'product'])
            ->paginate(10)
            ->appends($request->query());
        
        return Inertia::render('InvoiceOrders/Index', [
            'invoiceOrderData' => $invoiceOrders,
        ]);
    }

    /**
     * Show the form for creating a new invoice order.
     */
    public function create()
    {
        // Fetch all invoices and orders to populate dropdowns in the form
        $invoices = Invoice::with('customer')->get(['invoice_id', 'customer_id']);
        $orders = Order::with('items.product')->get(['order_id', 'total_payment', 'discount']);
        // $orderItems = OrderItems::with('')

        return Inertia::render('InvoiceOrders/CreateEdit', [
            'datas' => null, 
            'invoices' => $invoices,
            'orders' => $orders,
        ]);
    }

    /**
     * Store a newly created invoice order in storage.
     */
    public function store(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,invoice_id',
            'order_id' => 'required|exists:orders,order_id',
            'product_id' => 'required|exists:product,product_id',
            'total' => 'required|numeric|min:0',
            'sub_total' => 'required|numeric|min:0',
            'product_code'  => 'required|string|max:100',
            'product_title' => 'required|string|max:255',
            'product_color' => 'required|string|max:50',  
            'product_ram' => 'required|string|max:10',        
            'quantity'      => 'required|integer',
        ]);

        // Fetch the related Order to calculate sub_total if needed
        $order = Order::with('items.product')->findOrFail($validated['order_id']);
        
        // Create the InvoiceOrder
        InvoiceOrder::create([
            'invoice_id' => $validated['invoice_id'],
            'order_id' => $validated['order_id'],
            'total' => $validated['total'],
            'sub_total' => $subTotal, 
            'product_color' => $validated['product_color'],
            'product_ram'   => $validated['product_ram'],
        ]);

        return redirect()
            ->route('invoice-orders.index')
            ->with('success', 'Invoice Order created successfully.');
    }

    /**
     * Display the specified invoice order.
     */
    public function show(InvoiceOrder $invoiceOrder, $id)
    {
        $invoice = Invoice::with(['customer', 'invoiceOrders.product', 'order', 'order.items'])
            ->findOrFail($id);

        // Ensure the invoice payment status is synchronized with the order
        if ($invoice->order && $invoice->order->is_paid && !$invoice->is_paid) {
            $invoice->update(['is_paid' => true]);
            \Log::info("Updated invoice {$id} payment status to match order {$invoice->order->order_id}");
        }

        $subTotal = $invoice->invoiceOrders->sum(function ($item) {
            return $item->quantity * ($item->product_price ?? 0);
        });
        
        $invoice->sub_total = $subTotal;

        return Inertia::render('InvoiceOrders/Index', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Show the form for editing the specified invoice order.
     */
    public function edit(InvoiceOrder $invoiceOrder, $id)
    {
        $invoiceOrder = InvoiceOrder::with(['invoice.customer', 'order.items'])
            ->findOrFail($id);

        $invoices = Invoice::with('customer')->get(['invoice_id', 'customer_id']);
        $orders = Order::with('items.product')->get(['order_id', 'total_payment', 'discount']);

        return Inertia::render('InvoiceOrders/CreateEdit', [
            'datas' => $invoiceOrder,
            'invoices' => $invoices,
            'orders' => $orders,
        ]);
    }

    /**
     * Update the specified invoice order in storage.
     */
    public function update(Request $request, InvoiceOrder $invoiceOrder, $id)
    {
        // Validate the request
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,invoice_id',
            'order_id' => 'required|exists:orders,order_id',
            'total' => 'required|numeric|min:0',
            'sub_total' => 'required|numeric|min:0',
        ]);

        // Fetch the InvoiceOrder to update
        $invoiceOrder = InvoiceOrder::findOrFail($id);

        // Fetch the related Order to recalculate sub_total if needed
        $order = Order::with('items.product')->findOrFail($validated['order_id']);

        // Update the InvoiceOrder
        $invoiceOrder->update([
            'invoice_id' => $validated['invoice_id'],
            'order_id' => $validated['order_id'],
            'total' => $validated['total'],
            'sub_total' => $subTotal, 
        ]);

        return redirect()
            ->route('invoice-orders.index')
            ->with('success', 'Invoice Order updated successfully.');
    }

    /**
     * Remove the specified invoice order from storage.
     */
    public function destroy(InvoiceOrder $invoiceOrder, $id)
    {
        $invoiceOrder = InvoiceOrder::findOrFail($id);
        $invoiceOrder->delete();

        return redirect()
            ->route('invoice-orders.index')
            ->with('success', 'Invoice Order deleted successfully.');
    }
}