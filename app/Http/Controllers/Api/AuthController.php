<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use JWTAuth;
use JWTAuthException;
use App\Models\User;
use HasApiTokens;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Get a JWT via given credentials.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    private function createToken($user)
    {
        try {
            $token = $user->createToken('auth_token')->plainTextToken;
            if (!$token) {
                return response()->json([
                    'response' => 'error',
                    'message' => 'Token creation failed',
                ]);
            }
            return $token;
        } catch (\Exception $e) {
            return response()->json([
                'response' => 'error',
                'message' => 'Token creation failed',
            ]);
        }
    }

    public function login(Request $request)
    {
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['success' => false, "error" => true, 'email' => true, "message" => "Email not found"]);
        }

        if ($user->status == 2) {
            return response()->json(['success' => false, "error" => true, 'data' => $user, "message" => "Your Account has been deleted."]);
        }

        if (Hash::check($request->password, $user->password)) {
            // Check if user is active
            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'error' => true,
                    'message' => 'Your account has been suspended. Please contact administrator.'
                ], 403);
            }

            $token = $this->createToken($user);
            $user->save();

            if (!empty($user)) {
                $permissions = $user->getAllPermissions()->pluck('name');
            } else {
                $permissions = [];
            }
            return response()->json(["success" => true, "error" => false, 'data' => $user, 'message' => 'Login successfully!']);
        } else {
            return response()->json(["success" => false, "error" => true, "password" => true, "message" => "The password doesn't match"]);
        }
    }

    public function register(Request $request)
    {
        try {
            $validated = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:255'],
                'email' => [
                    'required',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email'),
                ],
                'password' => [
                    'required',
                    'string',
                    Password::min(8)
                        ->letters()
                        ->mixedCase()
                        ->numbers()
                        ->symbols()
                        ->uncompromised(),
                ],
                'roles' => ['nullable'],
                'roles.*' => ['string', 'exists:roles,name'],
            ])->validate();

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            // Assign the role
            if (!empty($validated['roles'])) {
                $user->assignRole('User');
            }

            if ($user->save()) {
                $token = $this->createToken($user);
                if (!is_string($token)) {
                    return response()->json(['success' => false, 'message' => 'Token generation failed'], 201);
                }
                $user->save();

                // Fire the UserRegistered event for Telegram notifications
                event(new \App\Events\UserRegistered($user));

                return response()->json(['success' => true, "error" => false, 'message' => 'You are register successfully!!!.', 'data' => $user], 200);
            } else {
                return response()->json(['success' => false, "error" => false, 'message' => 'Something went worng, You cannot register!', 'data' => 'Can not register user'], 201);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function me()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        return response()->json($user);
    }
    /**
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
     */

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $token = $this->createToken($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }
}
