<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google for authentication.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google callback.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            \Illuminate\Support\Facades\Log::info('Google OAuth User Data:', [
                'id' => $googleUser->id,
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'avatar' => $googleUser->avatar,
            ]);

            // Check if user already exists with this Google ID
            $user = User::where('google_id', $googleUser->id)->first();

            if ($user) {
                // Update avatar if changed
                if ($user->google_avatar !== $googleUser->avatar) {
                    $user->update(['google_avatar' => $googleUser->avatar]);
                }

                // User exists, log them in
                Auth::login($user, true); // Remember the user
                \Illuminate\Support\Facades\Log::info('Existing Google user logged in:', ['user_id' => $user->id]);
                return redirect()->route('home')->with('success', 'Welcome back! You have been logged in successfully.');
            }

            // Check if user exists with this email
            $user = User::where('email', $googleUser->email)->first();

            if ($user) {
                // User exists with email, link Google account
                $user->update([
                    'google_id' => $googleUser->id,
                    'google_avatar' => $googleUser->avatar,
                    'email_verified_at' => now(), // Mark as verified since Google verified it
                ]);
                Auth::login($user, true); // Remember the user
                \Illuminate\Support\Facades\Log::info('Existing user linked with Google:', ['user_id' => $user->id]);
                return redirect()->route('home')->with('success', 'Your Google account has been linked successfully!');
            }

            // Create new user
            $user = User::create([
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'google_id' => $googleUser->id,
                'google_avatar' => $googleUser->avatar,
                'password' => Hash::make(Str::random(16)), // Random password for security
                'email_verified_at' => now(), // Google emails are pre-verified
                'is_active' => true,
            ]);

            \Illuminate\Support\Facades\Log::info('New Google user created:', ['user_id' => $user->id]);

            // Assign default role if using Spatie Permission
            try {
                $userRole = \Spatie\Permission\Models\Role::where('name', 'User')
                    ->where('guard_name', 'web') // Changed from 'api' to 'web' for web authentication
                    ->first();

                if ($userRole) {
                    $user->assignRole($userRole);
                    \Illuminate\Support\Facades\Log::info('Role assigned to new Google user:', ['user_id' => $user->id, 'role' => 'User']);
                } else {
                    \Illuminate\Support\Facades\Log::warning('User role not found for Google user');
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to assign User role: ' . $e->getMessage());
            }

            Auth::login($user, true); // Remember the user
            \Illuminate\Support\Facades\Log::info('New Google user logged in:', ['user_id' => $user->id]);
            return redirect()->route('home')->with('success', 'Welcome to Phone Shop! Your account has been created successfully.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->route('login')->withErrors(['google' => 'Authentication failed: ' . $e->getMessage()]);
        }
    }
}
