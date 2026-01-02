<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $permission  The required permission
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, $permission): Response
    {
        // Get the currently authenticated user
        $user = $request->user();

        // Debug logging
        Log::info('Permission check', [
            'route' => $request->route()->getName(),
            'method' => $request->method(),
            'required_permission' => $permission,
            'user_id' => $user?->id,
            'user_authenticated' => $user !== null,
            'user_permissions' => $user ? $user->getAllPermissions()->pluck('name')->toArray() : [],
            'has_required_permission' => $user ? $user->hasPermissionTo($permission) : false,
            'is_inertia' => $request->header('X-Inertia') ? 'yes' : 'no',
            'is_ajax' => $request->ajax(),
            'wants_json' => $request->wantsJson(),
            'headers' => $request->headers->all(),
        ]);

        // If user is not authenticated, handle based on request type
        if (!$user) {
            Log::warning('Unauthenticated access attempt', [
                'route' => $request->route()->getName(),
                'method' => $request->method()
            ]);

            if ($request->wantsJson() || $request->ajax() || $request->header('X-Inertia')) {
                return response()->json(['error' => 'Unauthenticated.'], 401);
            }

            return redirect()->route('login');
        }

        // Check if the user has the specified permission
        if (!$user->hasPermissionTo($permission)) {
            Log::warning('Permission denied', [
                'route' => $request->route()->getName(),
                'user_id' => $user->id,
                'required_permission' => $permission
            ]);

            // Handle different types of requests
            if ($request->wantsJson() || $request->ajax() || $request->header('X-Inertia')) {
                return response()->json([
                    'error' => 'You do not have the required permission.'
                ], 403);
            }

            return redirect()->back()->with('error', 'You do not have the required permission.');
        }

        return $next($request);
    }
}
