<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class OrderItemController extends Controller
{
    public function index(Request $request)
    {
        $orderItems = OrderItem::with('order', 'product')
            ->paginate($request->input('per_page', 10))
            ->appends($request->query());

        return Inertia::render('OrderItems/Index', [
            'products' => Product::all(),
            'orders' => Order::all(),
            'orderItems' => $orderItems,
        ]);
    }

    public function create(Request $request)
    {
        $orderItems = OrderItem::with('order', 'product')
            ->paginate($request->input('per_page', 10))
            ->appends($request->query());

        return Inertia::render('OrderItems/CreateEdit', [
            'products' => Product::with('images')->get(),
            'orders' => Order::all(),
            'orderItem' => null,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'order_id' => 'required|exists:orders,order_id',
                'product_id' => 'required|exists:products,product_id',
                'product_code' => 'required|string|max:100',
                'product_title' => 'required|string|max:255',
                'product_price' => 'required|numeric',
                'quantity' => 'required|integer|min:1',
            ]);

            $product = Product::with('images')->findOrFail($validated['product_id']);

            OrderItem::create([
                'order_id' => $validated['order_id'],
                'product_id' => $validated['product_id'],
                'product_code' => $validated['product_code'],
                'product_title' => $validated['product_title'],
                'product_price' => $validated['product_price'],
                'quantity' => $validated['quantity'],
                'product_color' => $product->color?->color_title, 
                'product_ram'   => $product->product_ram,
            ]);

            return redirect()->route('order-items.index')->with('success', 'Order item created successfully.');
        } catch (\Exception $e) {
            Log::error('Order item creation failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to create order item: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $orderItem = OrderItem::with('order', 'product')->findOrFail($id);
        return Inertia::render('OrderItems/Show', [
            'item' => $orderItem,
        ]);
    }

    public function edit($id)
    {
        $orderItem = OrderItem::findOrFail($id);
        return Inertia::render('OrderItems/CreateEdit', [
            'products' => Product::with('images')->get(),
            'orders' => Order::all(),
            'orderItem' => $orderItem,
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'order_id' => 'required|exists:orders,order_id',
                'product_id' => 'required|exists:products,product_id',
                'product_code' => 'required|string|max:100',
                'product_title' => 'required|string|max:255',
                'product_price' => 'required|numeric',
                'quantity' => 'required|integer|min:1',
            ]);

            $orderItem = OrderItem::findOrFail($id);
            $product = Product::with('images')->findOrFail($validated['product_id']);

            $orderItem->update([
                'order_id' => $validated['order_id'],
                'product_id' => $validated['product_id'],
                'product_code' => $validated['product_code'],
                'product_title' => $validated['product_title'],
                'product_price' => $validated['product_price'],
                'quantity' => $validated['quantity'],
            ]);

            return redirect()->route('order-items.index')->with('success', 'Order item updated successfully.');
        } catch (\Exception $e) {
            Log::error('Order item update failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to update order item: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            $orderItem = OrderItem::findOrFail($id);
            $orderItem->delete();
            return redirect()->route('order-items.index')->with('success', 'Order item deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Order item deletion failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to delete order item: ' . $e->getMessage()]);
        }
    }

    public function checkExists(Request $request)
    {
        $request->validate(['order_item_id' => 'required|integer']);
        $exists = OrderItem::where('order_item_id', $request->order_item_id)->exists();
        return response()->json(['exists' => $exists]);
    }
}
