<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? array_merge($user->load('roles')->toArray(), [
                    'two_factor_enabled' => !is_null($user->two_factor_secret),
                    'two_factor_confirmed' => !is_null($user->two_factor_confirmed_at),
                    'has_two_factor' => $user->hasEnabledTwoFactorAuthentication(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                ]) : null,
                'can' => $user ?
                    ($user->loadMissing('roles.permissions')->roles?->flatMap(function ($role) {
                        return $role->permissions;
                    })?->mapWithKeys(function ($permission) {
                        return [$permission['name'] => auth()->user()->can($permission['name'])];
                    })?->all() ?? []) : [],
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'csrf_token' => csrf_token(),
        ]);
    }
}
