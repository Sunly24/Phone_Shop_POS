<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::min(8)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->symbols()
                ->uncompromised()],
            'terms' => 'required|accepted',
        ], [
            'terms.required' => 'You must accept the Terms and Conditions to create an account.',
            'terms.accepted' => 'You must accept the Terms and Conditions to create an account.',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // 🔥 AUTO-ASSIGN DEFAULT ROLE
        try {
            $userRole = \Spatie\Permission\Models\Role::where('name', 'User')
                ->where('guard_name', 'web') // Changed from 'api' to 'web' for web authentication
                ->first();

            if ($userRole) {
                $user->assignRole($userRole);
                \Illuminate\Support\Facades\Log::info('Role assigned to new manual user:', ['user_id' => $user->id, 'role' => 'User']);
            } else {
                \Illuminate\Support\Facades\Log::warning('User role not found for manual registration');
            }
        } catch (\Exception $e) {
            // If User role doesn't exist, we'll handle this gracefully
            // You should run the role creation command first
            \Illuminate\Support\Facades\Log::error('Failed to assign User role: ' . $e->getMessage());
        }

        event(new Registered($user));
        Auth::login($user);

        // Check if user needs email verification
        if ($user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail && !$user->hasVerifiedEmail()) {
            \Illuminate\Support\Facades\Log::info("📧 New user registration - redirecting to email verification", [
                'user_id' => $user->id,
                'email' => $user->email
            ]);
            return redirect()->route('verification.notice')
                ->with('success', 'Welcome to Phone Shop! Please verify your email address to complete registration.');
        }

        // If email verification is not required or already verified
        \Illuminate\Support\Facades\Log::info("🏠 New user registration - redirecting to home", [
            'user_id' => $user->id,
            'email' => $user->email,
            'email_verified' => $user->hasVerifiedEmail()
        ]);
        return redirect()->route('home')->with('success', 'Welcome to Phone Shop! Your account has been created successfully.');
    }
}
