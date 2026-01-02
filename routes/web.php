<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\ColorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\MakerController;
use App\Http\Controllers\SizeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvoiceOrderController;
use App\Http\Controllers\KHQRController;
use App\Http\Controllers\TelegramController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TwoFactorQrCodeController;
use App\Http\Controllers\PublicOrderController;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\TelegramAuthController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\OrderHistoryUserController;

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// CSRF token refresh endpoint
Route::get('/csrf-token', function () {
    return response()->json(['token' => csrf_token()]);
})->name('csrf-token');

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('/shop', [PublicController::class, 'shop'])->name('public.shop');
Route::get('/product/{id}', [PublicController::class, 'productDetail'])->name('public.product');
Route::get('/about', [PublicController::class, 'about'])->name('public.about');
Route::get('/contact', [PublicController::class, 'contact'])->name('public.contact');
Route::get('/terms', [PublicController::class, 'terms'])->name('public.terms');
Route::get('/privacy', [PublicController::class, 'privacy'])->name('public.privacy');

// Sitemap for SEO
Route::get('/sitemap.xml', [PublicController::class, 'sitemap'])->name('sitemap');

// Google OAuth Routes
Route::get('/auth/google', [GoogleAuthController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');

// Debug route for Google OAuth (remove in production)
Route::get('/debug/google-config', function () {
    return response()->json([
        'google_config' => config('services.google'),
        'app_url' => config('app.url'),
        'session_driver' => config('session.driver'),
        'session_lifetime' => config('session.lifetime'),
    ]);
})->name('debug.google');


// ============================================
// AUTHENTICATED ROUTES (Admin System - Web Guard)
// ============================================
Route::middleware([
    'auth:web',
    config('jetstream.auth_session'),
    'verified',
    'staff',
])->group(function () {

    // ============================================
    // DASHBOARD
    // ============================================
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ============================================
    // PROFILE MANAGEMENT
    // ============================================
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });

    Route::middleware('auth')->get('/order-history', [OrderHistoryUserController::class, 'index']);

    // ============================================
    // AUDIT LOGS
    // ============================================
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'getRecentLogs'])->name('audit.logs')->middleware('check:activity-log-list');
        Route::get('/index', [AuditLogController::class, 'index'])->name('audit-logs.index')->middleware('check:activity-log-list');
        Route::get('/export-direct', [AuditLogController::class, 'exportDirect'])->name('audit-logs.export-direct')->middleware('check:activity-log-list');
        Route::get('/download-export', [AuditLogController::class, 'downloadExport'])->name('audit-logs.download-export')->middleware('check:activity-log-list');
        Route::get('/export-notifications', [AuditLogController::class, 'getExportNotifications'])->name('audit-logs.export-notifications')->middleware('check:activity-log-list');
        Route::post('/dismiss-notification/{id}', [AuditLogController::class, 'dismissNotification'])->name('audit-logs.dismiss-notification')->middleware('check:activity-log-list');
    });

    // ============================================
    // TELEGRAM INTEGRATION
    // ============================================
    Route::prefix('telegram')->middleware('auth')->group(function () {
        Route::get('/verify', [TelegramAuthController::class, 'showVerifyForm'])->name('telegram.verify.form');
        Route::post('/verify', [TelegramAuthController::class, 'verify'])->name('telegram.verify');
        Route::post('/verify-auth', [TelegramAuthController::class, 'verify'])->name('telegram.verify.auth');
        Route::post('/verify-order', [TelegramController::class, 'verify'])->name('telegram.verify.order');
    });

    // ============================================
    // RESOURCE MANAGEMENT WITH PERMISSIONS
    // ============================================

    // Categories Management
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index'])->name('categories.index')->middleware('check:category-list');
        Route::get('/create', [CategoryController::class, 'create'])->name('categories.create')->middleware('check:category-create');
        Route::post('/', [CategoryController::class, 'store'])->name('categories.store')->middleware('check:category-create');
        Route::get('/{id}', [CategoryController::class, 'edit'])->name('categories.edit')->middleware('check:category-edit');
        Route::patch('/{id}', [CategoryController::class, 'update'])->name('categories.update')->middleware('check:category-edit');
        Route::delete('/{id}', [CategoryController::class, 'destroy'])->name('categories.destroy')->middleware('check:category-delete');
    });

    // Roles Management
    Route::prefix('roles')->group(function () {
        Route::get('/', [RolesController::class, 'index'])->name('roles.index')->middleware('check:role-list');
        Route::get('/create', [RolesController::class, 'create'])->name('roles.create')->middleware('check:role-create');
        Route::post('/', [RolesController::class, 'store'])->name('roles.store')->middleware('check:role-create');
        Route::get('/{id}/show', [RolesController::class, 'show'])->name('roles.show')->middleware('check:role-list');
        Route::get('/{id}', [RolesController::class, 'edit'])->name('roles.edit')->middleware('check:role-edit');
        Route::patch('/{id}', [RolesController::class, 'update'])->name('roles.update')->middleware('check:role-edit');
        Route::delete('/{id}', [RolesController::class, 'destroy'])->name('roles.destroy')->middleware('check:role-delete');
    });

    // Users Management
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('users.index')->middleware('check:user-list');
        Route::get('/create', [UserController::class, 'create'])->name('users.create')->middleware('check:user-create');
        Route::post('/', [UserController::class, 'store'])->name('users.store')->middleware('check:user-create');
        Route::get('/export', [UserController::class, 'export'])->name('users.export')->middleware('check:user-list');
        Route::post('/import', [UserController::class, 'import'])->name('users.import')->middleware('check:user-create');
        Route::patch('/{id}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password')->middleware('check:user-edit');
        Route::patch('/{id}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status')->middleware('check:user-edit');
        Route::get('/{id}', [UserController::class, 'edit'])->name('users.edit')->middleware('check:user-edit');
        Route::patch('/{id}', [UserController::class, 'update'])->name('users.update')->middleware('check:user-edit');
        Route::delete('/{id}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('check:user-delete');
    });

    // Colors Management
    Route::prefix('colors')->group(function () {
        Route::get('/', [ColorController::class, 'index'])->name('colors.index')->middleware('check:color-list');
        Route::get('/create', [ColorController::class, 'create'])->name('colors.create')->middleware('check:color-create');
        Route::post('/', [ColorController::class, 'store'])->name('colors.store')->middleware('check:color-create');
        Route::get('/{color}', [ColorController::class, 'edit'])->name('colors.edit')->middleware('check:color-edit');
        Route::patch('/{color}', [ColorController::class, 'update'])->name('colors.update')->middleware('check:color-edit');
        Route::delete('/{color}', [ColorController::class, 'destroy'])->name('colors.destroy')->middleware('check:color-delete');
    });

    // Customers Management
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index'])->name('customers.index')->middleware('check:customer-list');
        Route::get('/create', [CustomerController::class, 'create'])->name('customers.create')->middleware('check:customer-create');
        Route::post('/', [CustomerController::class, 'store'])->name('customers.store')->middleware('check:customer-create');
        Route::get('/{id}', [CustomerController::class, 'edit'])->name('customers.edit')->middleware('check:customer-edit');
        Route::patch('/{id}', [CustomerController::class, 'update'])->name('customers.update')->middleware('check:customer-edit');
        Route::delete('/{id}', [CustomerController::class, 'destroy'])->name('customers.destroy')->middleware('check:customer-delete');
    });

    // Brands Management
    Route::prefix('brands')->group(function () {
        Route::get('/', [BrandController::class, 'index'])->name('brands.index')->middleware('check:brand-list');
        Route::get('/create', [BrandController::class, 'create'])->name('brands.create')->middleware('check:brand-create');
        Route::post('/', [BrandController::class, 'store'])->name('brands.store')->middleware('check:brand-create');
        Route::get('/{id}', [BrandController::class, 'edit'])->name('brands.edit')->middleware('check:brand-edit');
        Route::patch('/{id}', [BrandController::class, 'update'])->name('brands.update')->middleware('check:brand-edit');
        Route::delete('/{id}', [BrandController::class, 'destroy'])->name('brands.destroy')->middleware('check:brand-delete');
    });

    // Makers Management
    Route::prefix('makers')->group(function () {
        Route::get('/', [MakerController::class, 'index'])->name('makers.index')->middleware('check:maker-list');
        Route::get('/create', [MakerController::class, 'create'])->name('makers.create')->middleware('check:maker-create');
        Route::post('/', [MakerController::class, 'store'])->name('makers.store')->middleware('check:maker-create');
        Route::get('/{id}', [MakerController::class, 'edit'])->name('makers.edit')->middleware('check:maker-edit');
        Route::patch('/{id}', [MakerController::class, 'update'])->name('makers.update')->middleware('check:maker-edit');
        Route::delete('/{id}', [MakerController::class, 'destroy'])->name('makers.destroy')->middleware('check:maker-delete');
    });

    // Sizes Management
    Route::prefix('sizes')->group(function () {
        Route::get('/', [SizeController::class, 'index'])->name('sizes.index')->middleware('check:size-list');
        Route::get('/create', [SizeController::class, 'create'])->name('sizes.create')->middleware('check:size-create');
        Route::post('/', [SizeController::class, 'store'])->name('sizes.store')->middleware('check:size-create');
        Route::get('/{id}', [SizeController::class, 'edit'])->name('sizes.edit')->middleware('check:size-edit');
        Route::patch('/{id}', [SizeController::class, 'update'])->name('sizes.update')->middleware('check:size-edit');
        Route::delete('/{id}', [SizeController::class, 'destroy'])->name('sizes.destroy')->middleware('check:size-delete');
    });

    // Products Management
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('products.index')->middleware('check:product-list');
        Route::get('/create', [ProductController::class, 'create'])->name('products.create')->middleware('check:product-create');
        Route::post('/', [ProductController::class, 'store'])->name('products.store')->middleware('check:product-create');
        // ✅ SIMPLIFIED EXPORT ROUTES (3 total) - Smart export with auto queue/direct selection
        Route::get('/export', [ProductController::class, 'exportDirect'])->name('products.export')->middleware('check:product-list');
        Route::get('/download-export', [ProductController::class, 'downloadExport'])->name('products.download-export')->middleware('check:product-list');
        Route::get('/export-notifications', [ProductController::class, 'getExportNotifications'])->name('products.export-notifications')->middleware('check:product-list');
        Route::post('/dismiss-notification/{id}', [ProductController::class, 'dismissNotification'])->name('products.dismiss-notification')->middleware('check:product-list');

        Route::post('/{id}/update-stock', [ProductController::class, 'updateStock'])->name('products.updateStock');
        Route::post('/import', [ProductController::class, 'import'])->name('products.import')->middleware('check:product-create');
        Route::get('/{id}/show', [ProductController::class, 'show'])->name('products.show')->middleware('check:product-list');
        Route::get('/{id}', [ProductController::class, 'edit'])->name('products.edit')->middleware('check:product-edit');
        Route::patch('/{id}', [ProductController::class, 'update'])->name('products.update')->middleware('check:product-edit');
        Route::post('/{id}/update-stock', [ProductController::class, 'updateStock'])->name('products.updateStock');
        Route::delete('/{id}', [ProductController::class, 'destroy'])->name('products.destroy')->middleware('check:product-delete');
    });

    // Orders Management
    Route::prefix('orders')->group(function () {
        Route::get('/',     [OrderController::class, 'index'])->name('orders.index')->middleware('check:order-list');
        Route::get('/create', [OrderController::class, 'create'])->name('orders.create')->middleware('check:order-create');
        Route::post('/',    [OrderController::class, 'store'])->name('orders.store');
        Route::get('/show/{id}', [OrderController::class, 'show'])->name('orders.show')->middleware('check:order-list');
        Route::get('/{id}/edit', [OrderController::class, 'edit'])->name('orders.edit')->middleware('check:order-edit');
        Route::patch('/{id}', [OrderController::class, 'update'])->name('orders.update');
        Route::delete('/{id}', [OrderController::class, 'destroy'])->name('orders.destroy')->middleware('check:order-delete');
        Route::get('/export/{format}', [OrderController::class, 'export'])->name('orders.export');
    });


    // Order Items Management
    Route::prefix('order-items')->group(function () {
        Route::get('/', [OrderItemController::class, 'index'])->name('orderItem.index')->middleware('check:orderItem-list');
        Route::get('/create', [OrderItemController::class, 'create'])->name('orderItem.create')->middleware('check:orderItem-create');
        Route::post('/', [OrderItemController::class, 'store'])->name('orderItem.store')->middleware('check:orderItem-create');
        Route::get('/{id}', [OrderItemController::class, 'edit'])->name('orderItem.edit')->middleware('check:orderItem-edit');
        Route::patch('/{id}', [OrderItemController::class, 'update'])->name('orderItem.update')->middleware('check:orderItem-edit');
        Route::delete('/{id}', [OrderItemController::class, 'destroy'])->name('orderItem.destroy')->middleware('check:orderItem-delete');
    });

    // Invoices Management
    Route::prefix('invoices')->group(function () {
        Route::get('/', [InvoiceController::class, 'index'])->name('invoices.index')->middleware('check:invoice-list');
        Route::get('/create', [InvoiceController::class, 'create'])->name('invoices.create')->middleware('check:invoice-create');
        Route::get('/show/{id}', [InvoiceController::class, 'show'])->name('invoices.show')->middleware(['check:invoice-list']);
        Route::post('/', [InvoiceController::class, 'store'])->name('invoices.store')->middleware('check:invoice-create');
        Route::get('/{id}', [InvoiceController::class, 'edit'])->name('invoices.edit')->middleware('check:invoice-edit');
        Route::patch('/{id}', [InvoiceController::class, 'update'])->name('invoices.update')->middleware('check:invoice-edit');
        Route::delete('/{id}', [InvoiceController::class, 'destroy'])->name('invoices.destroy')->middleware('check:invoice-delete');
    });

    // Invoice Orders Management
    Route::prefix('invoice-orders')->group(function () {
        Route::get('/', [InvoiceOrderController::class, 'index'])->name('invoiceOrders.index')->middleware('check:invoiceOrder-list');
        Route::get('/create', [InvoiceOrderController::class, 'create'])->name('invoiceOrders.create')->middleware('check:invoiceOrder-create');
        Route::post('/', [InvoiceOrderController::class, 'store'])->name('invoiceOrders.store')->middleware('check:invoiceOrder-create');
        Route::get('/show/{id}', [InvoiceOrderController::class, 'show'])->name('invoiceOrders.show')->middleware('check:invoiceOrder-list');
        Route::get('/{id}/edit', [InvoiceOrderController::class, 'edit'])->name('invoiceOrders.edit')->middleware('check:invoiceOrder-edit');
        Route::patch('/{id}', [InvoiceOrderController::class, 'update'])->name('invoiceOrders.update')->middleware('check:invoiceOrder-edit');
        Route::delete('/{id}', [InvoiceOrderController::class, 'destroy'])->name('invoiceOrders.destroy')->middleware('check:invoiceOrder-delete');
    });

    // Inventory Management
    Route::prefix('inventories')->group(function () {
        Route::get('/', [InventoryController::class, 'index'])->name('inventory.index')->middleware('check:inventory-list');
        Route::get('/create', [InventoryController::class, 'create'])->name('inventory.create')->middleware('check:inventory-create');
        Route::post('/', [InventoryController::class, 'store'])->name('inventory.store')->middleware('check:inventory-create');
        Route::get('/export/{format}', [InventoryController::class, 'export'])->name('inventory.export')->middleware('check:inventory-list');
        Route::get('/{id}', [InventoryController::class, 'edit'])->name('inventory.edit')->middleware('check:inventory-edit');
        Route::patch('/{id}', [InventoryController::class, 'update'])->name('inventory.update')->middleware('check:inventory-edit');
        Route::delete('/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy')->middleware('check:inventory-delete');
        Route::get('/export/{format}', [InventoryController::class, 'export'])->name('inventory.export');
        Route::post('/import', [InventoryController::class, 'import'])->name('inventory.import');
        Route::get('/inventory/export-info', [InventoryController::class, 'exportInfo']);
    });

    Route::get('export-status', function () {
        return response()->json(['status' => Cache::get('inventory_export_status', 'pending')]);
    });

    // ============================================
    // SPECIALIZED FEATURES
    // ============================================

    // Chat Support Routes
    Route::prefix('chat')->group(function () {
        Route::get('/', [ChatController::class, 'index'])->name('chat.index')->middleware('check:chat-list');
        Route::get('/available-agents', [ChatController::class, 'getAvailableAgents'])->name('chat.available-agents')->middleware('check:chat-list');

        // Debug route - remove this in production
        Route::get('/debug/{sessionId}', [ChatController::class, 'debugSession'])->name('chat.debug');

        Route::get('/{sessionId}', [ChatController::class, 'show'])->name('chat.show')->middleware('check:chat-list');
        Route::get('/{sessionId}/messages', [ChatController::class, 'getMessages'])->name('chat.messages')->middleware('check:chat-list');
        Route::post('/{sessionId}/reply', [ChatController::class, 'reply'])->name('chat.reply')->middleware('check:chat-reply');
        Route::put('/{sessionId}/status', [ChatController::class, 'updateStatus'])->name('chat.update-status')->middleware('check:chat-edit');
        Route::put('/{sessionId}/mark-read', [ChatController::class, 'markAsRead'])->name('chat.markAsRead')->middleware('check:chat-list');
        Route::delete('/{sessionId}', [ChatController::class, 'destroy'])->name('chat.destroy')->middleware('check:chat-delete');
        // Assignment routes
        Route::post('/{sessionId}/assign', [ChatController::class, 'assignSession'])->name('chat.assign')->middleware('check:chat-edit');
        Route::post('/{sessionId}/auto-assign', [ChatController::class, 'autoAssignSession'])->name('chat.autoAssign')->middleware('check:chat-edit');
        Route::post('/{sessionId}/unassign', [ChatController::class, 'unassignSession'])->name('chat.unassign')->middleware('check:chat-edit');
        Route::post('/{sessionId}/take', [ChatController::class, 'takeSession'])->name('chat.take')->middleware('check:chat-reply');
    });

    // Bakong/KHQR payment routes
    // Route::post('/bakong/check-status', [KHQRController::class, 'checkPaymentByMD5'])->name('bakong.check.status');
    Route::post('/process-cash-payment', [KHQRController::class, 'processCashPayment'])->name('process.cash.payment');
    // Route::post('/bakong/webhook', [KHQRController::class, 'handleWebhook']);

    // KHQR Payment routes
    Route::prefix('qr')->group(function () {
        Route::match(['get', 'post'], '/generate', [KHQRController::class, 'generate'])->name('qr.generate');
        Route::post('/check', [KHQRController::class, 'check'])->name('qr.check');
        Route::post('/update-order', [KHQRController::class, 'updateOrderId'])->name('qr.update-order');
    });


    // Two Factor Authentication
    Route::get('/user/custom-two-factor-qr-code', [TwoFactorQrCodeController::class, 'show'])->name('two-factor.custom-qr-code');
});

Route::post('/public-orders', [PublicOrderController::class, 'store']);

// Diagnostic routes (outside auth middleware)
Route::get('/qr/test-connectivity', [KHQRController::class, 'testConnectivity'])->name('qr.test-connectivity');

require __DIR__ . '/auth.php';
