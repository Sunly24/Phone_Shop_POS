<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Maker;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Size;
use App\Models\Color;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Http\Requests\ProductRequest;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\ProductsImport;
use App\Exports\ProductsExport;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\ExportRequest;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use App\Jobs\ProcessExportJob;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\NotificationController;
use App\Events\ProductNotification;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $colorId = $request->input('color_id');
        $perPage = $request->input('per_page', 10);

        $query = Product::with(['images', 'color']);

        if ($search) {
            $query->where('product_title', 'like', '%' . $search . '%');
        }

        if ($colorId) {
            $query->where('color_id', $colorId);
        }

        $products = $query->latest()
            ->paginate($perPage)
            ->appends($request->only(['search', 'color_id', 'per_page']));

        return inertia('Products/Index', [
            'productData' => $products,
            'filters' => [
                'search' => $search,
                'color_id' => $colorId,
            ],
            'colors' => Color::select('color_id', 'color_title')->orderBy('color_title')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = Category::select('id', 'name')->orderBy('name')->get();
        $brands = Brand::select('brand_id', 'brand_title')->orderBy('brand_title')->get();
        $makers = Maker::select('maker_id', 'maker_title')->orderBy('maker_title')->get();
        $sizes = Size::select('size_id', 'size_title')->orderBy('size_title')->get();
        $colors = Color::select('color_id', 'color_title')->orderBy('color_title')->get();

        return inertia('Products/CreateEdit', [
            'datas' => null,
            'categories' => $categories,
            'brands' => $brands,
            'makers' => $makers,
            'sizes' => $sizes,
            'colors' => $colors
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Validate the request data
            $rules = [
                'product_title' => 'required|max:255|min:2',
                'product_code' => 'required|string',
                'product_description' => 'nullable|string',
                'product_price' => 'required|numeric',
                'product_stock' => 'required|integer',
                'product_status' => 'required|boolean',
                'product_ram' => 'nullable|integer',
                'category_id' => 'required|integer|exists:categories,id',
                'brand_id' => 'nullable|integer|exists:brands,brand_id',
                'maker_id' => 'nullable|integer|exists:makers,maker_id',
                'size_id' => 'nullable|integer|exists:sizes,size_id',
                'color_id' => 'nullable|string|exists:colors,color_id',
                'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
            ];

            $validated = $request->validate($rules);

            // Add user_id to validated data
            $validated['user_id'] = Auth::id() ?? 1;

            // Make sure numeric fields are cast correctly
            $validated['product_price'] = (float) $validated['product_price'];
            $validated['product_stock'] = (int) $validated['product_stock'];
            $validated['product_status'] = (bool) $validated['product_status'];

            // Handle product_ram - set to null if empty
            if (empty($validated['product_ram']) || $validated['product_ram'] === '') {
                $validated['product_ram'] = null;
            } else {
                $validated['product_ram'] = (int) $validated['product_ram'];
            }

            // Create the product
            $product = Product::create($validated);
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $image) {
                    try {
                        if (!$image->isValid()) {
                            continue;
                        }

                        $path = $image->store('product-images', 'public');

                        $imageData = [
                            'product_id' => $product->product_id,
                            'image_path' => $path,
                            'image_name' => $image->getClientOriginalName(),
                            'image_size' => $image->getSize(),
                            'image_type' => $image->getClientMimeType(),
                        ];

                        $productImage = ProductImage::create($imageData);
                    } catch (\Exception $e) {
                        Log::error('Failed to process product image: ' . $e->getMessage());
                    }
                }
            }

            // Broadcast real-time notification via Pusher
            event(new ProductNotification(
                $product->product_id,
                'created',
                $product->product_title,
                $product->product_price,
                Auth::user()->name ?? 'System'
            ));

            // Store notification in database
            \App\Models\Notification::createProductNotification(
                $product->product_id,
                'created',
                $product->product_title,
                $product->product_price,
                Auth::user()->name ?? 'System',
                Auth::id()
            );

            // Redirect to products list with success message
            return redirect()->route('products.index')
                ->with('success', 'Product created successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()
                ->withInput()
                ->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('Product creation failed: ' . $e->getMessage());

            return back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create product: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $product = Product::with(['images', 'category', 'brand', 'maker', 'size', 'color'])->findOrFail($id);

        return inertia('Products/Show', [
            'product' => $product
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product, $id)
    {
        $rsDatasModel = Product::with('images')->find($id);
        $categories = Category::select('id', 'name')->orderBy('name')->get();
        $brands = Brand::select('brand_id', 'brand_title')->orderBy('brand_title')->get();
        $makers = Maker::select('maker_id', 'maker_title')->orderBy('maker_title')->get();
        $sizes = Size::select('size_id', 'size_title')->orderBy('size_title')->get();
        $colors = Color::select('color_id', 'color_title')->orderBy('color_title')->get();

        return inertia('Products/CreateEdit', [
            'datas' => $rsDatasModel,
            'categories' => $categories,
            'brands' => $brands,
            'makers' => $makers,
            'sizes' => $sizes,
            'colors' => $colors
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $validationRules = [
                'product_title' => 'sometimes|required|max:255|min:2',
                'product_code' => 'sometimes|required|string',
                'product_description' => 'sometimes|nullable|string',
                'product_price' => 'sometimes|required|numeric',
                'product_stock' => 'sometimes|required|integer',
                'product_status' => 'sometimes|required|boolean',
                'product_ram'  => 'sometimes|nullable|integer',
                'category_id' => 'sometimes|required|integer|exists:categories,id',
                'brand_id' => 'sometimes|nullable|integer|exists:brands,brand_id',
                'maker_id' => 'sometimes|nullable|integer|exists:makers,maker_id',
                'size_id' => 'sometimes|nullable|integer|exists:sizes,size_id',
                'color_id' => 'sometimes|nullable|integer|exists:colors,color_id',
                'images' => 'nullable|array',
                'images.*' => 'nullable|file|image|mimes:jpeg,png,jpg,gif|max:2048',
                'deleted_images' => 'sometimes|nullable|array',
                'deleted_images.*' => 'sometimes|integer|exists:product_images,product_image_id'
            ];

            $validated = $request->validate($validationRules);

            // Cast color_id to integer if it exists
            if (isset($validated['color_id'])) {
                $validated['color_id'] = (int) $validated['color_id'];
            }

            // Handle product_ram - set to null if empty
            if (isset($validated['product_ram'])) {
                if (empty($validated['product_ram']) || $validated['product_ram'] === '') {
                    $validated['product_ram'] = null;
                } else {
                    $validated['product_ram'] = (int) $validated['product_ram'];
                }
            }

            // Get the product
            $product = Product::findOrFail($id);

            // Update product fields
            $updateData = collect($validated)->except(['images', 'deleted_images'])->toArray();
            if (!empty($updateData)) {
                $updateData['user_id'] = Auth::id();
                $product->update($updateData);
            }

            // Handle deleted images if present in request
            if ($request->has('deleted_images') && is_array($request->deleted_images)) {
                foreach ($request->deleted_images as $imageId) {
                    $image = ProductImage::find($imageId);
                    if ($image) {
                        try {
                            Storage::disk('public')->delete($image->image_path);
                            $image->delete();
                        } catch (\Exception $e) {
                            Log::error('Failed to delete product image: ' . $e->getMessage());
                        }
                    }
                }
            }

            // Handle new images if present in request
            if ($request->hasFile('images')) {
                $files = $request->file('images');
                foreach ($files as $image) {
                    try {
                        // Validate the image
                        if (!$image->isValid()) {
                            continue;
                        }

                        // Store the image
                        $path = $image->store('product-images', 'public');

                        // Create the ProductImage record
                        $imageData = [
                            'product_id' => $product->product_id,
                            'image_path' => $path,
                            'image_name' => $image->getClientOriginalName(),
                            'image_size' => $image->getSize(),
                            'image_type' => $image->getClientMimeType(),
                        ];

                        ProductImage::create($imageData);
                    } catch (\Exception $e) {
                        Log::error('Failed to process product image: ' . $e->getMessage());
                    }
                }
            }

            // Broadcast real-time notification via Pusher
            event(new \App\Events\ProductChanged(
                $product->product_id,
                'updated',
                $product->product_title,
                $product->product_price,
                Auth::user()->name ?? 'System'
            ));

            // Store notification in database
            \App\Models\Notification::createProductNotification(
                $product->product_id,
                'updated',
                $product->product_title,
                $product->product_price,
                Auth::user()->name ?? 'System',
                Auth::id()
            );

            return redirect()->route('products.show', ['id' => $product->product_id])
                ->with('success', 'Product updated successfully');
        } catch (\Exception $e) {
            Log::error('Product update failed: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Failed to update product: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);

            // Store product data before deletion for broadcasting
            $productTitle = $product->product_title;
            $productPrice = $product->product_price;

            // Delete the product (images will be automatically deleted via model event)
            $product->delete();

            // Broadcast real-time notification via Pusher
            event(new \App\Events\ProductChanged(
                $id,
                'deleted',
                $productTitle,
                $productPrice,
                Auth::user()->name ?? 'System'
            ));

            // Store notification in database
            \App\Models\Notification::createProductNotification(
                $id,
                'deleted',
                $productTitle,
                $productPrice,
                Auth::user()->name ?? 'System',
                Auth::id()
            );

            return redirect()->route('products.index')
                ->with('success', 'Product deleted successfully');
        } catch (\Exception $e) {
            Log::error('Failed to delete product', [
                'product_id' => $id,
                'error' => $e->getMessage()
            ]);

            return redirect()->route('products.index')
                ->with('error', 'Failed to delete product: ' . $e->getMessage());
        }
    }

    public function checkExists(Request $request)
    {
        $request->validate([
            'product_title' => 'required|string',
        ]);

        $exists = Product::checkExists($request->input('product_title'));

        return response()->json(['exists' => $exists]);
    }



    /**
     * Download completed export file
     *
     * @param \Illuminate\Http\Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function downloadExport(Request $request)
    {
        try {
            // Check if user is authenticated
            if (!Auth::check()) {
                return redirect()->route('login');
            }

            // Check if user has permission
            if (!Auth::user()->can('product-list')) {
                return back()->withErrors(['error' => 'You do not have permission to download product exports']);
            }

            $exportId = $request->input('export_id');

            // Find the export request
            $exportRequest = ExportRequest::where('id', $exportId)
                ->where('user_id', Auth::id())
                ->first();

            if (!$exportRequest) {
                return back()->withErrors(['error' => 'Export request not found.']);
            }

            if (!$exportRequest->isReady()) {
                return back()->withErrors(['error' => 'Export file is not ready yet or has expired.']);
            }

            if ($exportRequest->isExpired()) {
                return back()->withErrors(['error' => 'Export file has expired.']);
            }

            $filePath = storage_path('app/' . $exportRequest->file_path);

            if (!file_exists($filePath)) {
                return back()->withErrors(['error' => 'Export file not found.']);
            }

            Log::info("User {$exportRequest->user->name} downloading export: {$exportRequest->file_name}");

            return response()->download($filePath, $exportRequest->file_name);
        } catch (\Exception $e) {
            Log::error('Export download failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to download export: ' . $e->getMessage()]);
        }
    }



    /**
     * Smart export - automatically chooses direct or queue based on data size
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function exportDirect(Request $request)
    {
        try {
            // Check if user is authenticated
            if (!Auth::check()) {
                return redirect()->route('login');
            }

            // Check if user has permission
            if (!Auth::user()->can('product-list')) {
                return back()->withErrors(['error' => 'You do not have permission to export products']);
            }

            // Get format from request (default to xlsx)
            $format = $request->input('format', 'xlsx');

            // Get filters from request
            $search = $request->input('search');
            $colorId = $request->input('color_id');

            // Build query to check data size
            $query = Product::query();

            // Apply filters
            if ($search) {
                $query->where('product_title', 'like', '%' . $search . '%');
            }

            if ($colorId) {
                $query->where('color_id', $colorId);
            }

            // Check the total count first
            $totalRecords = $query->count();

            // Define thresholds
            $SMALL_EXPORT_LIMIT = 1000;  // Direct download
            $MEDIUM_EXPORT_LIMIT = 5000; // Queue with faster processing

            if ($totalRecords <= $SMALL_EXPORT_LIMIT) {
                // Small dataset - Direct download
                return $this->processDirectExport($query, $format, $search, $colorId);
            } elseif ($totalRecords <= $MEDIUM_EXPORT_LIMIT) {
                // Medium dataset - Queue with high priority
                return $this->processQueueExport($request, 'high', $totalRecords);
            } else {
                // Large dataset - Queue with normal priority
                return $this->processQueueExport($request, 'normal', $totalRecords);
            }
        } catch (\Exception $e) {
            Log::error('Smart export failed: ' . $e->getMessage());
            Log::error('Smart export error trace: ' . $e->getTraceAsString());
            return back()->withErrors(['error' => 'Failed to export products: ' . $e->getMessage()]);
        }
    }

    /**
     * Process direct export for small datasets
     */
    private function processDirectExport($query, $format, $search, $colorId)
    {
        // Direct processing for small datasets
        $products = $query->with(['category', 'brand', 'maker', 'size', 'color'])->get();
        $timestamp = now()->format('Y-m-d_H-i-s');

        if ($format === 'pdf') {
            return $this->generatePdfExport($products, $search, $colorId, $timestamp);
        } else {
            return $this->generateExcelExport($products, $format, $timestamp);
        }
    }

    /**
     * Process queue export for medium/large datasets
     */
    private function processQueueExport($request, $priority = 'normal', $recordCount = 0)
    {
        // Get filters from request
        $filters = [
            'search' => $request->input('search'),
            'color_id' => $request->input('color_id')
        ];

        // Create export request with priority and record count
        $exportRequest = ExportRequest::create([
            'user_id' => Auth::id(),
            'export_type' => 'products',
            'format' => $request->input('format', 'xlsx'),
            'filters' => $filters,
            'status' => ExportRequest::STATUS_PENDING,
            'priority' => $priority,
            'record_count' => $recordCount,
            'requested_at' => now()
        ]);

        // For high priority, process immediately
        if ($priority === 'high') {
            ProcessExportJob::dispatch($exportRequest)->onQueue('high');
            $estimatedTime = '1-2 minutes';
        } else {
            ProcessExportJob::dispatch($exportRequest)->onQueue('default');
            $estimatedTime = '3-5 minutes';
        }

        // Return JSON response for AJAX requests
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Export queued successfully! Estimated time: {$estimatedTime}",
                'export_id' => $exportRequest->id,
                'estimated_time' => $estimatedTime,
                'record_count' => $recordCount
            ]);
        }

        return back()->with('success', "Export queued successfully! Your file with {$recordCount} records will be ready in {$estimatedTime}. Check the notification bell for updates.");
    }

    /**
     * Generate PDF export
     */
    private function generatePdfExport($products, $search, $colorId, $timestamp)
    {
        // Get color filter name if applied
        $colorFilter = null;
        if ($colorId) {
            $color = \App\Models\Color::find($colorId);
            $colorFilter = $color ? $color->color_title : 'Unknown Color';
        }

        // Generate PDF using HTML template
        $pdf = Pdf::loadView('pdf.products', [
            'products' => $products,
            'search' => $search,
            'colorFilter' => $colorFilter,
        ]);

        // Set paper size and orientation
        $pdf->setPaper('A4', 'landscape');

        $filename = "products_{$timestamp}.pdf";
        return $pdf->download($filename);
    }

    /**
     * Generate Excel/CSV export
     */
    private function generateExcelExport($products, $format, $timestamp)
    {
        $extension = $format === 'csv' ? 'csv' : 'xlsx';
        $filename = "products_{$timestamp}.{$extension}";

        // Create the export data
        $exportData = $products->map(function ($product) {
            return [
                'ID' => $product->product_id,
                'Title' => $product->product_title,
                'Code' => $product->product_code,
                'Description' => $product->product_description,
                'Price' => $product->product_price,
                'Stock' => $product->product_stock,
                'RAM' => $product->product_ram . 'GB',
                'Category' => $product->category ? $product->category->name : '-',
                'Brand' => $product->brand ? $product->brand->brand_title : '-',
                'Maker' => $product->maker ? $product->maker->maker_title : '-',
                'Size' => $product->size ? $product->size->size_title : '-',
                'Color' => $product->color ? $product->color->color_title : '-',
                'Status' => $product->product_status ? 'Active' : 'Inactive',
                'Created At' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : '',
                'Updated At' => $product->updated_at ? $product->updated_at->format('Y-m-d H:i:s') : '',
            ];
        })->toArray();

        // Add headers
        if (!empty($exportData)) {
            array_unshift($exportData, array_keys($exportData[0]));
        }

        // Create temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'products_export_');

        if ($format === 'csv') {
            // Generate CSV
            $handle = fopen($tempFile, 'w');
            foreach ($exportData as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        } else {
            // Generate Excel using PhpSpreadsheet
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Add data
            $rowIndex = 1;
            foreach ($exportData as $row) {
                $colIndex = 1;
                foreach ($row as $cell) {
                    $sheet->setCellValueByColumnAndRow($colIndex, $rowIndex, $cell);
                    $colIndex++;
                }
                $rowIndex++;
            }

            // Style headers
            $headerStyle = [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'f3f4f6']
                ]
            ];
            $sheet->getStyle('A1:' . Coordinate::stringFromColumnIndex(count($exportData[0])) . '1')->applyFromArray($headerStyle);

            // Auto-size columns
            foreach (range('A', $sheet->getHighestColumn()) as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save($tempFile);
        }

        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Export products to PDF using DOMPDF with HTML template
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */


    /**
     * Import products from Excel
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function import(Request $request)
    {
        try {
            // Validate the uploaded file
            $validated = $request->validate([
                'file' => 'required|file|mimes:xlsx,xls|max:5120'
            ], [
                'file.required' => 'Please select a file to import',
                'file.file' => 'The uploaded file is invalid',
                'file.mimes' => 'The file must be an Excel file (xlsx or xls)',
                'file.max' => 'The file size must not exceed 5MB'
            ]);

            // Get the uploaded file path
            $filePath = $request->file('file')->getRealPath();

            // Create import instance
            $import = new ProductsImport();

            // Initialize spreadsheet for image extraction
            $import->initSpreadsheet($filePath);

            // Import the file
            Excel::import($import, $request->file('file'));

            // Return success response
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Products imported successfully'
                ]);
            }

            return redirect()->back()->with('success', 'Products imported successfully');
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errors = collect($failures)->map(function ($failure) {
                return "Row {$failure->row()}: {$failure->errors()[0]}";
            })->join("\n");



            if ($request->wantsJson()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $errors
                ], 422);
            }

            return redirect()->back()->withErrors(['error' => $errors]);
        } catch (\Exception $e) {
            Log::error('Import failed: ' . $e->getMessage());

            if ($request->wantsJson()) {
                return response()->json([
                    'error' => 'Import failed',
                    'message' => $e->getMessage()
                ], 500);
            }

            return redirect()->back()->withErrors(['error' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Get user's export notifications
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getExportNotifications(Request $request)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Simple cache key for user's export notifications
            $cacheKey = "export_notifications_products_" . Auth::id();

            // Check if we have cached data (cache for 15 seconds to reduce DB load)
            $cachedData = Cache::get($cacheKey);
            if ($cachedData) {
                return response()->json($cachedData);
            }

            // Get recent export requests for the user (exclude dismissed)
            $notifications = ExportRequest::where('user_id', Auth::id())
                ->where('export_type', 'products')
                ->where('created_at', '>=', now()->subDays(7)) // Last 7 days
                ->notDismissed() // Exclude dismissed notifications
                ->orderBy('requested_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($request) {
                    $statusText = $this->getExportStatusText($request);
                    $progressPercentage = $this->getProgressPercentage($request);

                    return [
                        'id' => $request->id,
                        'type' => 'export',
                        'title' => 'Products Export (' . strtoupper($request->format) . ')',
                        'message' => $statusText,
                        'status' => $request->status,
                        'progress' => $progressPercentage,
                        'record_count' => $request->record_count ?? 0,
                        'file_name' => $request->file_name,
                        'requested_at' => $request->requested_at,
                        'processed_at' => $request->processed_at,
                        'expires_at' => $request->expires_at,
                        'is_ready' => $request->isReady(),
                        'is_expired' => $request->isExpired(),
                        'can_download' => $request->isReady() && !$request->isExpired(),
                        'time_ago' => $request->requested_at->diffForHumans(),
                        'priority' => $request->priority ?? 'normal'
                    ];
                });

            // Count unread notifications (completed exports not yet dismissed)
            $unreadCount = ExportRequest::where('user_id', Auth::id())
                ->where('export_type', 'products')
                ->where('status', ExportRequest::STATUS_COMPLETED)
                ->where('created_at', '>=', now()->subDays(7))
                ->notDismissed() // Exclude dismissed notifications
                ->count();

            $responseData = [
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ];

            // Cache the response for 15 seconds to reduce DB load during frequent polling
            Cache::put($cacheKey, $responseData, 15);

            return response()->json($responseData);
        } catch (\Exception $e) {
            Log::error('Failed to get export notifications: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get notifications'], 500);
        }
    }

    /**
     * Get human readable status text
     */
    private function getExportStatusText($exportRequest)
    {
        switch ($exportRequest->status) {
            case ExportRequest::STATUS_PENDING:
                return "Export queued - processing will begin shortly...";
            case ExportRequest::STATUS_PROCESSING:
                return "Processing {$exportRequest->record_count} records...";
            case ExportRequest::STATUS_COMPLETED:
                if ($exportRequest->isExpired()) {
                    return "Export completed but file has expired";
                }
                return "Export completed! Click to download.";
            case ExportRequest::STATUS_FAILED:
                return "Export failed: " . ($exportRequest->error_message ?? 'Unknown error');
            default:
                return "Unknown status";
        }
    }

    /**
     * Get progress percentage
     */
    private function getProgressPercentage($exportRequest)
    {
        switch ($exportRequest->status) {
            case ExportRequest::STATUS_PENDING:
                return 10;
            case ExportRequest::STATUS_PROCESSING:
                return 75;
            case ExportRequest::STATUS_COMPLETED:
                return 100;
            case ExportRequest::STATUS_FAILED:
                return 0;
            default:
                return 0;
        }
    }

    /**
     * Dismiss export notification
     */
    public function dismissNotification(Request $request, $id)
    {
        try {
            $exportRequest = ExportRequest::where('id', $id)
                ->where('user_id', Auth::id())
                ->where('export_type', 'products')
                ->first();

            if (!$exportRequest) {
                return response()->json(['error' => 'Notification not found'], 404);
            }

            $exportRequest->markAsDismissed();

            return response()->json(['success' => true, 'message' => 'Notification dismissed']);
        } catch (\Exception $e) {
            Log::error('Failed to dismiss notification: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to dismiss notification'], 500);
        }
    }

    public function updateStock(Request $request, $id)
    {
        $request->validate([
            'stock' => 'required|integer|min:0'
        ]);

        $product = Product::findOrFail($id);
        $oldStock = $product->product_stock;
        $newStock = $request->input('stock');

        // Update product stock
        $product->product_stock = $newStock;
        $product->save();

        // Log activity in activity_product table
        DB::table('activity_product')->insert([
            'product_id' => $product->product_id,
            'stock' => $newStock,
            'created_at' => now(),
            'status' => $newStock > $oldStock ? 1 : 2, // 1 = increase, 2 = decrease
        ]);

        // Broadcast real-time notification via Pusher for stock update
        event(new \App\Events\ProductChanged(
            $product->product_id,
            'stock_updated',
            $product->product_title,
            $product->product_price,
            Auth::user()->name ?? 'System'
        ));

        // Store notification in database for stock update
        \App\Models\Notification::createProductNotification(
            $product->product_id,
            'stock_updated',
            $product->product_title,
            $product->product_price,
            Auth::user()->name ?? 'System',
            Auth::id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Stock updated successfully',
            'old_stock' => $oldStock,
            'new_stock' => $newStock
        ]);
    }
}
