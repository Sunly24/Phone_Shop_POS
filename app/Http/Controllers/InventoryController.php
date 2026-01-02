<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\OrderItems;
use App\Models\Order;
use App\Exports\InventoryExport; 
use App\Imports\InventoryImport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class InventoryController extends Controller
{
    /**
     * Display a listing of the inventories.
     */
    public function index(Request $request)
    {
        $search = $request->input('search', ''); 
        $perPage = $request->input('per_page', 10);

        // Building the query for filtering
        $query = Inventory::with(['product' => function($query) {
            $query->select('product_id', 'product_title', 'product_price', 'product_stock');
        }]);

        // Apply the search filter if there's a search query
        if ($search) {
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('product_title', 'like', "%{$search}%")
                ->orWhere('product_id', 'like', "%{$search}%");
            });
        }

        // Get the filtered and paginated results
        $inventories = $query->select('id', 'product_id', 'quantity_booked', 'updated_at')
                            ->orderBy('product_id', 'asc')
                            ->paginate($perPage)
                            ->appends(['search' => $search, 'per_page' => $perPage]); // Make sure the search filter is in the pagination

        // Fetch the products to show
        $products = Product::with(['color', 'inventory'])
            ->withCount([
                'orderItems as quantity_booked' => function($query) {
                    $query->select(DB::raw('COALESCE(SUM(quantity), 0)'));
                }
            ])
            ->orderBy('product_title')
            ->paginate($perPage)
            ->appends(['search' => $search, 'per_page' => $perPage]);

        // Return data to frontend
        return Inertia::render('Inventory/Index', [
            'products' => $products,
            'inventories' => $inventories,
            'filters' => ['search' => $search],
        ]);
    }

    public function exportInfo()
    {
        $info = [];
        if (Storage::disk('local')->exists('inventory_export_info.json')) {
            $info = json_decode(Storage::disk('local')->get('inventory_export_info.json'), true);
        }
        return response()->json($info);
    }

    public function export($format, Request $request)
    {
        $inventories = Inventory::with('product')->get();

        if ($format == 'excel') {
            return Excel::download(new InventoryExport($inventories), 'inventory_list.xlsx');
        } elseif ($format == 'pdf') {
            $systemName = "My System Name"; 
            $date = now()->format('F d, Y'); 
            
            $pdf = Pdf::loadView('exports.inventory_pdf', [
                'inventories' => $inventories,
                'systemName' => $systemName,
                'date' => $date
            ]);
            
            return $pdf->download('inventory_list.pdf');
        }

        return redirect()->back()->withErrors('Invalid export format');
    }


    public function import(Request $request)
    {
        
        $request->validate([
            'import_file' => 'required|file|mimes:xlsx,xls'
        ]);

        Excel::import(new InventoryImport, $request->file('import_file'));

        return redirect()->route('inventory.index')->with('success', 'Inventory imported successfully.');
    }

    /**
     * Show the form for creating a new inventory record.
     */
    public function create()
    {
        $products = Product::with(['color', 'inventory'])
        ->withCount([
            'orderItems as quantity_booked' => function($query) {
                $query->select(DB::raw('COALESCE(SUM(quantity), 0)'));
            }
        ])
        ->get();


        return Inertia::render('Inventory/CreateEdit', [
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created inventory record.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,product_id',
                'product_title' => 'required|string|max:255',
                'product_price' => 'required|numeric|min:0',
                'product_stock' => 'required|integer|min:0',
                'quantity_booked' => 'nullable|integer|min:0',
            ]);

            // Update the product details first
            $product = Product::find($validated['product_id']);
            $product->update([
                'product_title' => $validated['product_title'],
                'product_price' => $validated['product_price'],
                'product_stock' => $validated['product_stock'],
            ]);

            // Calculate the current quantity_booked from order items for this specific product
            $actualQuantityBooked = OrderItems::where('product_id', $validated['product_id'])
                ->sum('quantity');

            // Check if inventory record already exists for this product
            $existingInventory = Inventory::where('product_id', $validated['product_id'])->first();
            
            if ($existingInventory) {
                // Update existing inventory record
                $existingInventory->update([
                    'product_title' => $validated['product_title'],
                    'product_price' => $validated['product_price'],
                    'product_stock' => $validated['product_stock'],
                    'quantity_booked' => $actualQuantityBooked,
                    'last_updated_by' => Auth::id(),
                    'updated_at' => now(),
                ]);
            } else {
                // Create new inventory record
                Inventory::create([
                    'product_id' => $validated['product_id'],
                    'product_title' => $validated['product_title'],
                    'product_price' => $validated['product_price'],
                    'product_stock' => $validated['product_stock'],
                    'quantity_booked' => $actualQuantityBooked,
                    'last_updated_by' => Auth::id(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return redirect()->route('inventory.index')
                            ->with('success', 'Inventory created successfully.');

        } catch (\Exception $e) {
            Log::error('Inventory creation failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to create inventory.']);
        }
    }

    /**
     * Show the form for editing the specified inventory.
     */
    public function edit(Inventory $inventory)
    {
        $inventory->load('product:id,product_title,product_price,product_stock');
        $products = Product::withCount(['orderItems as quantity_booked'])
            ->select('product_id', 'product_title', 'product_price', 'product_stock')
            ->get();

        return Inertia::render('Inventory/CreateEdit', [
            'inventory' => $inventory,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified inventory record.
     */
    public function update(Request $request, Inventory $inventory)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,product_id',
                'product_title' => 'required|string|max:255',
                'product_price' => 'required|numeric|min:0',
                'product_stock' => 'required|integer|min:0',
                'quantity_booked' => 'required|integer|min:0',
            ]);

            // Update the product details
            $product = Product::find($validated['product_id']);
            $product->update([
                'product_title' => $validated['product_title'],
                'product_price' => $validated['product_price'],
                'product_stock' => $validated['product_stock'],
            ]);

            // Calculate the current quantity_booked from order items for this specific product
            $actualQuantityBooked = OrderItems::where('product_id', $validated['product_id'])
                ->sum('quantity');

            // Update only this specific inventory record - force timestamp update
            $inventory->update([
                'product_title' => $validated['product_title'],
                'product_price' => $validated['product_price'],
                'product_stock' => $validated['product_stock'],
                'quantity_booked' => $actualQuantityBooked, // Use actual booked quantity instead of form input
                'last_updated_by' => Auth::id(),
                'updated_at' => now(), // Force update the timestamp
            ]);

            return redirect()->route('inventory.index')
                            ->with('success', 'Inventory updated successfully.');
        } catch (\Exception $e) {
            Log::error('Inventory update failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to update inventory.']);
        }
    }

    /**
     * Remove the specified inventory record from storage.
     */
    public function destroy(Inventory $inventory, $id)
    {
        try {
            $inventory = Inventory::findOrFail($id);
            $inventory->delete();
            return redirect()->route('inventory.index')->with('success', 'Inventory deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Inventory deletion failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to delete inventory.']);
        }
    }
}
