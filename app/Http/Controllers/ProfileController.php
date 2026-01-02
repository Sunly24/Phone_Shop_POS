<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'sessions' => $this->sessions($request)->all(),
        ]);
    }

    /**
     * Get the current sessions.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Support\Collection
     */
    public function sessions(Request $request)
    {
        if (config('session.driver') !== 'database') {
            return collect();
        }

        // Get current session ID
        $currentSessionId = $request->session()->getId();

        // Query the database directly for sessions
        $sessions = DB::connection(config('session.connection'))
            ->table(config('session.table', 'sessions'))
            ->where('user_id', $request->user()->getAuthIdentifier())
            ->orderBy('last_activity', 'desc')
            ->get();

        return $sessions->map(function ($session) use ($currentSessionId, $request) {
            // Parse user agent string manually
            $userAgent = $session->user_agent ?? '';
            $isMobile = stripos($userAgent, 'mobile') !== false ||
                stripos($userAgent, 'android') !== false ||
                stripos($userAgent, 'iphone') !== false;

            // Simple browser detection
            $browser = 'Unknown';
            if (stripos($userAgent, 'chrome') !== false) $browser = 'Chrome';
            else if (stripos($userAgent, 'safari') !== false) $browser = 'Safari';
            else if (stripos($userAgent, 'firefox') !== false) $browser = 'Firefox';
            else if (stripos($userAgent, 'edge') !== false) $browser = 'Edge';
            else if (stripos($userAgent, 'opera') !== false) $browser = 'Opera';

            // Simple platform detection
            $platform = 'Unknown';
            if (stripos($userAgent, 'windows') !== false) $platform = 'Windows';
            else if (stripos($userAgent, 'mac os') !== false) $platform = 'macOS';
            else if (stripos($userAgent, 'linux') !== false) $platform = 'Linux';
            else if (stripos($userAgent, 'android') !== false) $platform = 'Android';
            else if (stripos($userAgent, 'iphone') !== false || stripos($userAgent, 'ipad') !== false) $platform = 'iOS';

            return (object) [
                'agent' => [
                    'is_desktop' => !$isMobile,
                    'platform' => $platform,
                    'browser' => $browser,
                ],
                'ip_address' => $session->ip_address,
                'is_current_device' => $session->id === $currentSessionId,
                'last_active' => Carbon::createFromTimestamp($session->last_activity)->diffForHumans(),
            ];
        });
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validatedData = $request->validated();
        $user = $request->user();

        try {
            // Handle photo separately
            if ($request->hasFile('photo')) {
                $photo = $request->file('photo');
                if ($photo->isValid()) {
                    $user->updateProfilePhoto($photo);
                } else {
                    return Redirect::route('profile.edit')->with('error', 'The uploaded file is not valid.');
                }
            }

            // Handle profile information if any fields are present
            if (isset($validatedData['name']) || isset($validatedData['email'])) {
                if (isset($validatedData['name'])) {
                    $user->name = $validatedData['name'];
                }
                if (isset($validatedData['email'])) {
                    $user->email = $validatedData['email'];
                }

                if ($user->isDirty('email')) {
                    $user->email_verified_at = null;
                }

                $user->save();
            }

            return Redirect::route('profile.edit')->with('status', 'profile-updated');
        } catch (\Exception $e) {
            return Redirect::route('profile.edit')->with('error', 'Failed to update profile: ' . $e->getMessage());
        }
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::guard('web')->logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
