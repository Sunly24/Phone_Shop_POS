<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $this->ensureIsNotRateLimited($request);

        // Check if user exists and verify password manually to check status before auth
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($this->throttleKey($request));

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // Check if user is blocked before authenticating
        if (!$user->is_active) {
            RateLimiter::hit($this->throttleKey($request));

            throw ValidationException::withMessages([
                'email' => 'Your account has been suspended. Please contact administrator.',
                'suspended' => true,
                'reason' => $user->block_reason,
            ]);
        }

        // Now authenticate with credentials
        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey($request));

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey($request));

        // Authentication successful, get user
        $user = Auth::user();

        if ($user && $user->two_factor_secret) {
            // Log the user out - we'll log them back in after 2FA
            Auth::logout();

            // Store user info in the session for the 2FA challenge
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => $request->boolean('remember'),
            ]);

            // Redirect to the 2FA challenge
            return redirect()->route('two-factor.login');
        }

        // No 2FA required, regenerate the session
        $request->session()->regenerate();

        // 🔥 ROLE-BASED REDIRECT AFTER LOGIN
        $user = Auth::user();

        // Check if user has admin, manager, or staff roles
        $userRoles = $user->roles->pluck('name')->toArray();
        $isAdminOrManager = in_array('Admin', $userRoles) || in_array('Manager', $userRoles);
        $isStaff = in_array('Staff', $userRoles);

        if ($isAdminOrManager || $isStaff) {
            // Admin/Manager/Staff users go to dashboard (Staff will be redirected to orders.create by DashboardController)
            return redirect()->intended(route('dashboard', absolute: false));
        } else {
            // Regular users (User role) go to home page
            return redirect()->intended(route('home', absolute: false));
        }
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    private function ensureIsNotRateLimited(Request $request): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request), 5)) {
            return;
        }

        event(new Lockout($request));

        $seconds = RateLimiter::availableIn($this->throttleKey($request));

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    private function throttleKey(Request $request): string
    {
        return Str::transliterate(Str::lower($request->input('email')) . '|' . $request->ip());
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
