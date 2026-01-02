<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorLoginController extends Controller
{
    /**
     * Display the two-factor authentication challenge view.
     */
    public function create()
    {
        Log::info('2FA challenge view requested');
        return Inertia::render('Auth/TwoFactorChallenge');
    }

    /**
     * Handle the incoming two-factor authentication challenge.
     */
    public function store(Request $request)
    {
        Log::info('Processing 2FA login attempt');

        if (!$request->session()->has('login.id')) {
            Log::warning('2FA attempt without login.id in session');
            return redirect()->route('login');
        }

        $user = User::find($request->session()->get('login.id'));

        if (!$user) {
            Log::warning('2FA attempt for non-existent user');
            $request->session()->forget('login.id');
            throw ValidationException::withMessages([
                'code' => __('Invalid user.'),
            ]);
        }

        if ($request->filled('code')) {
            Log::info('Attempting 2FA with code');

            // Validate the authentication code
            if (! $this->verifyCode($user, $request->code)) {
                Log::warning('Invalid 2FA code provided');
                throw ValidationException::withMessages([
                    'code' => __('The provided two factor authentication code was invalid.'),
                ]);
            }

            // Authentication successful, log the user in
            $this->authenticateUser($request, $user);

            Log::info('2FA authentication successful with code');

            return $this->getRedirectAfterLogin();
        }

        if ($request->filled('recovery_code')) {
            Log::info('Attempting 2FA with recovery code');

            // Validate the recovery code
            if (! $this->verifyRecoveryCode($user, $request->recovery_code)) {
                Log::warning('Invalid recovery code provided');
                throw ValidationException::withMessages([
                    'recovery_code' => __('The provided two factor recovery code was invalid.'),
                ]);
            }

            // Authentication successful, log the user in
            $this->authenticateUser($request, $user);

            Log::info('2FA authentication successful with recovery code');

            return $this->getRedirectAfterLogin();
        }

        Log::warning('2FA attempt without code or recovery_code');
        throw ValidationException::withMessages([
            'code' => __('Please provide an authentication code or recovery code.'),
        ]);
    }

    /**
     * Verify the provided authentication code.
     */
    protected function verifyCode($user, $code)
    {
        try {
            $google2fa = new Google2FA();

            return $google2fa->verifyKey(
                decrypt($user->two_factor_secret),
                $code
            );
        } catch (\Exception $e) {
            Log::error('Error verifying 2FA code: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Verify the provided recovery code.
     */
    protected function verifyRecoveryCode($user, $recoveryCode)
    {
        try {
            // Get the recovery codes
            $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);

            // Find the matching code
            $key = array_search($recoveryCode, $recoveryCodes);

            if ($key === false) {
                return false;
            }

            // Remove the used code
            unset($recoveryCodes[$key]);

            // Update the recovery codes
            $user->two_factor_recovery_codes = encrypt(json_encode(array_values($recoveryCodes)));
            $user->save();

            return true;
        } catch (\Exception $e) {
            Log::error('Error verifying recovery code: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Authenticate the user.
     */
    protected function authenticateUser(Request $request, $user)
    {
        Auth::login($user, $request->session()->pull('login.remember', false));

        $request->session()->regenerate();
        $request->session()->forget('login.id');
    }

    /**
     * Get the appropriate redirect route based on user role after login
     */
    protected function getRedirectAfterLogin()
    {
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
}
