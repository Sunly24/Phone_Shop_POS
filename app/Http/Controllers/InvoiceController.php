<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Customer;
use App\Models\InvoiceOrder;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the invoices.
     */
    public function index(Request $request)
    {
        $search  = $request->input('search');
        $perPage = $request->input('per_page', 10);

        $query = Invoice::with('customer');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_id', 'like', "%{$search}%") 
                ->orWhereHas('customer', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%"); 
                });
            });
        }


        $invoices = $query
            ->orderBy('invoice_id', 'asc')
            ->paginate($perPage)
            ->appends($request->only('search', 'per_page'));


        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'filters'  => ['search' => $search],
        ]);
    }

    /**
     * Show the form for creating a new invoice.
     */
    public function create(Request $request)
    {
        $search = $request->input('search', '');

        return Inertia::render('Invoices/CreateEdit', [
            'invoice'   => new Invoice(),
            'customers' => Customer::orderBy('name')->get(['customer_id','name']),
            'products'  => Product::with() 
                                ->orderBy('product_title')
                                ->get(['product_id','product_title','product_price']),
            'filters'   => ['search' => $search],
        ]);
    }

    /**
     * Store a newly created invoice in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id'     => 'required|exists:orders,order_id',
            'customer_id'  => 'required|exists:customers,customer_id',
            'total_amount' => 'required|numeric',
            'sub_total'    => 'required|numeric',
            'is_paid'      => 'required|boolean',
            'items'        => 'required|array',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        return \DB::transaction(function () use ($validated) {
            $order = Order::with('items')->findOrFail($validated['order_id']);
            $customer = Customer::findOrFail($validated['customer_id']);

            // Create the invoice
            $invoice = Invoice::create([
                'order_id'     => $order->order_id,
                'customer_id'  => $customer->customer_id,
                'sub_total'    => $validated['sub_total'],
                'total_amount' => $validated['total_amount'],
                'currency'     => $order->currency ?? 'USD',
                'is_paid'      => $validated['is_paid'],
                'user_id'      => auth()->id(),
            ]);

            // Copy each order item to invoice_orders
            foreach ($order->items as $item) {
                InvoiceOrder::create([
                    'invoice_id'    => $invoice->invoice_id,
                    'order_id'      => $order->order_id,
                    'product_id'    => $item->product_id,
                    'product_code'  => $item->product_code,
                    'product_title' => $item->product_title,
                    'product_price' => $item->product_price,
                    'quantity'      => $item->quantity,
                    'total'         => $item->product_price * $item->quantity,
                    'sub_total'     => $validated['sub_total'],
                    'discount'      => $order->discount ?? 0,
                    'product_color' => $item->product_color,
                    'product_ram'   => $item->product_ram,
                ]);
            }

            return redirect()->route('invoices.index')->with('success', 'Invoice created successfully.');
        });
    }

    public function show($invoiceId)
    {
        
        $invoice = Invoice::with(['customer', 'invoiceOrders.product', 'invoiceOrders.product.color', 'order.items.product', 'order.items.product.color'])->findOrFail($invoiceId);

        $subTotal = $invoice->invoiceOrders->sum(function ($item) {
            return $item->quantity * ($item->product_price ?? 0);
        });

        $invoice->sub_total = $subTotal;

        return Inertia::render('InvoiceOrders/Index', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Show the form for editing the specified invoice.
     */
    public function edit(Invoice $invoice, $id)
    {
        $invoice = Invoice::with('customer')->findOrFail($id);

        return Inertia::render('Invoices/CreateEdit', [
            'invoice'   => $invoice,
            'products' => Product::with()->orderBy('product_title')->get(['product_id', 'product_title', 'product_price']),
            'customers' => Customer::orderBy('name')->get(['customer_id', 'name']),
        ]);
    }

    /**
     * Update the specified invoice in storage.
     */
    public function update(Request $request, Invoice $invoice, $id)
    {
        $validated = $request->validate([
            'invoice_id'   => 'required|string|max:255',
            'total_amount' => 'required|numeric',
            'sub_total'    => 'required|numeric',
            'customer_id'  => 'required|exists:customers,customer_id',
            'is_paid'      => 'required|boolean',
            'items'         => 'required|array',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        $invoice = Invoice::findOrFail($id);
        $customer = Customer::firstOrCreate(['name' => $validated['customer_name']]);

        // Update invoice fields
        $invoice->update([
            'customer_id'  => $validated['customer_id'],
            'invoice_id'   => $validated['invoice_id'],
            'total_amount' => $validated['total_amount'],
            'sub_total'    => $validated['sub_total'],
            'is_paid'      => $validated['is_paid'],
        ]);

        // Insert invoice orders based on order items
        foreach ($validated['items'] as $item) {
            InvoiceOrder::create([
                'invoice_id'    => $invoice->invoice_id,
                'order_id'      => $item['order_id'],
                'product_id'    => $item['product_id'],
                'product_code'  => $item['product_code'],
                'product_title' => $item['product_title'],
                'product_price' => $item['product_price'],
                'quantity'      => $item['quantity'],
                'total'         => $item['product_price'] * $item['quantity'],
                'sub_total'     => $validated['sub_total'],
                'discount'      => $item['discount'] ?? 0,
                'product_color' => $item['product_color'],
                'product_ram'   => $item['product_ram'],
            ]);
        }

        return redirect()->route('invoices.index')->with('success', 'Invoice updated successfully.');
    }

    /**
     * Remove the specified invoice from storage.
     */
    public function destroy($invoice_id)
    {
        $invoice = Invoice::findOrFail($invoice_id); 
        $invoice->delete();

        return redirect()
            ->route('invoices.index')
            ->with('success', 'Invoice deleted successfully.');
    }
}
