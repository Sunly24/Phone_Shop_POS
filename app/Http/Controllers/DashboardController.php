<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\OrderItems;
use App\Models\Invoice;
use App\Models\Brand;
use App\Models\Maker;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if ($user && $user->hasRole('Staff')) {
            return redirect()->route('orders.create');
        }

        // Get real statistics
        $totalOrders = Order::count();
        $totalProducts = Product::count();
        $totalUsers = User::count();
        $totalRevenue = Order::where('is_paid', true)->sum('total_payment');

        // Calculate percentage changes (comparing this month vs last month)
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $ordersThisMonth = Order::where('created_at', '>=', $currentMonth)->count();
        $ordersLastMonth = Order::whereBetween('created_at', [$lastMonth, $currentMonth])->count();
        $ordersChange = $ordersLastMonth > 0 ? (($ordersThisMonth - $ordersLastMonth) / $ordersLastMonth) * 100 : 0;

        $productsThisMonth = Product::where('created_at', '>=', $currentMonth)->count();
        $productsLastMonth = Product::whereBetween('created_at', [$lastMonth, $currentMonth])->count();
        $productsChange = $productsLastMonth > 0 ? (($productsThisMonth - $productsLastMonth) / $productsLastMonth) * 100 : 0;

        $usersThisMonth = User::where('created_at', '>=', $currentMonth)->count();
        $usersLastMonth = User::whereBetween('created_at', [$lastMonth, $currentMonth])->count();
        $usersChange = $usersLastMonth > 0 ? (($usersThisMonth - $usersLastMonth) / $usersLastMonth) * 100 : 0;

        $revenueThisMonth = Order::where('is_paid', true)->where('created_at', '>=', $currentMonth)->sum('total_payment');
        $revenueLastMonth = Order::where('is_paid', true)->whereBetween('created_at', [$lastMonth, $currentMonth])->sum('total_payment');
        $revenueChange = $revenueLastMonth > 0 ? (($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100 : 0;

        // Get monthly revenue data for chart (last 12 months)
        $monthlyRevenue = [];
        for ($i = 11; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();
            $revenue = Order::where('is_paid', true)
                           ->whereBetween('created_at', [$monthStart, $monthEnd])
                           ->sum('total_payment');
            $monthlyRevenue[] = [
                'month' => $monthStart->format('M'),
                'year' => $monthStart->format('y'),
                'revenue' => $revenue,
            ];
        }

        // Get order status statistics
        $completedOrders = Order::where('is_paid', true)->count();
        $pendingOrders = Order::where('is_paid', false)->count();
        $totalOrdersForPercentage = $totalOrders > 0 ? $totalOrders : 1;
        $completedPercentage = ($completedOrders / $totalOrdersForPercentage) * 100;

        // Get brand statistics
        $brandStats = DB::table('products')
            ->join('brands', 'products.brand_id', '=', 'brands.brand_id')
            ->join('makers', 'brands.maker_id', '=', 'makers.maker_id')
            ->select('makers.maker_title', DB::raw('COUNT(*) as count'))
            ->groupBy('makers.maker_id', 'makers.maker_title')
            ->orderBy('count', 'desc')
            ->limit(3)
            ->get();

        // Calculate brand percentages
        $totalBrandProducts = $brandStats->sum('count');
        $brandStatsWithPercentage = $brandStats->map(function ($brand) use ($totalBrandProducts) {
            return [
                'name' => $brand->maker_title,
                'count' => $brand->count,
                'percentage' => $totalBrandProducts > 0 ? ($brand->count / $totalBrandProducts) * 100 : 0,
            ];
        });

        // Get recent activities (last 10 activities)
        $recentOrders = Order::with('customer')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $recentProducts = Product::orderBy('created_at', 'desc')
            ->limit(3)
            ->get();

        $recentActivities = [];

        // Add recent orders to activities
        foreach ($recentOrders as $order) {
            $recentActivities[] = [
                'id' => 'order_' . $order->order_id,
                'title' => 'New order received',
                'description' => "Order #{$order->order_id}" . ($order->customer ? " from {$order->customer->name}" : ''),
                'time' => $order->created_at->diffForHumans(),
                'status' => $order->is_paid ? 'completed' : 'pending',
                'type' => 'order'
            ];
        }

        // Add recent products to activities
        foreach ($recentProducts as $product) {
            $recentActivities[] = [
                'id' => 'product_' . $product->product_id,
                'title' => 'Product added',
                'description' => "{$product->product_title} added to inventory",
                'time' => $product->created_at->diffForHumans(),
                'status' => 'completed',
                'type' => 'product'
            ];
        }

        // Sort activities by time
        usort($recentActivities, function ($a, $b) {
            return strtotime($b['time']) <=> strtotime($a['time']);
        });

        // Take only first 10 activities
        $recentActivities = array_slice($recentActivities, 0, 10);

        // Payment statistics
        $auditingAmount = Order::where('is_paid', false)->sum('total_payment');
        $completedAmount = Order::where('is_paid', true)->sum('total_payment');
        $rejectedAmount = 0; // You might want to add a rejected status to orders
        $totalRevenueFinal = $completedAmount;

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalOrders' => $totalOrders,
                'totalProducts' => $totalProducts,
                'totalUsers' => $totalUsers,
                'totalRevenue' => $totalRevenue,
                'ordersChange' => round($ordersChange, 1),
                'productsChange' => round($productsChange, 1),
                'usersChange' => round($usersChange, 1),
                'revenueChange' => round($revenueChange, 1),
            ],
            'monthlyRevenue' => $monthlyRevenue,
            'orderStatus' => [
                'completed' => $completedOrders,
                'pending' => $pendingOrders,
                'completedPercentage' => round($completedPercentage, 0),
            ],
            'brandStats' => $brandStatsWithPercentage,
            'recentActivities' => $recentActivities,
            'paymentStats' => [
                'auditing' => $auditingAmount,
                'completed' => $completedAmount,
                'rejected' => $rejectedAmount,
                'revenue' => $totalRevenueFinal,
            ]
        ]);
    }
}
