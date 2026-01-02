<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Check if user is authenticated and not active
        if ($user && !$user->is_active) {
            // Don't interfere with login attempts - let the login controller handle blocked users
            if ($request->routeIs('login') || $request->routeIs('two-factor.login')) {
                return $next($request);
            }

            Auth::logout();

            // For API requests (pure JSON)
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'error' => true,
                    'message' => 'Your account has been suspended. Please contact administrator.',
                    'reason' => $user->block_reason
                ], 403);
            }

            // For web requests - redirect to login with error
            return redirect()->route('login')->with('error', 'Your account has been suspended. Please contact administrator.');
        }

        return $next($request);
    }
}
