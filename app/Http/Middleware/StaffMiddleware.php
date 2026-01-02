<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class StaffMiddleware
{
    /**
     * Handle an incoming request.
     * Check if the authenticated user has Staff role
     * If true, they can only access order creation functionality
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            // Check if user has staff role
            if (Auth::user()->hasRole('Staff')) {                $allowedRoutes = [
                    'orders.index',
                    'orders.create',
                    'orders.store',
                    'orders.edit',
                    'orders.update',
                    'profile.edit',
                    'profile.update',
                    'invoices.index',
                    'invoices.show',
                    'invoiceOrders.show',
                    'qr.generate',
                    'qr.check',
                    'qr.status',
                    'qr.update-order',
                    'qr.test',
                    'logout'
                ];// Get current route name
                $currentRoute = $request->route()->getName();
                
                // If trying to access a non-allowed route, redirect to order creation
                if (!in_array($currentRoute, $allowedRoutes)) {
                    return redirect()->route('orders.create');
                }
            }
        }
        
        return $next($request);
    }
}
