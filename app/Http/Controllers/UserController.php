<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\UsersImport;
use App\Http\Requests\UserRequest;
use App\Exports\UsersExport;
use Barryvdh\DomPDF\Facade\Pdf;

class UserController extends Controller
{
    public function index()
    {
        $search = request('search');
        $perPage = request('per_page', 10);

        $users = User::with('roles')
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->paginate($perPage)
            ->appends(request()->query());

        return Inertia::render('Users/Index', [
            'users' => $users,
        ]);
    }

    public function create()
    {
        $roles = Role::where('guard_name', 'web')->get(); // Admin panel uses web guard
        return Inertia::render('Users/CreateEdit', [
            'user' => new User(),
            'roles' => $roles
        ]);
    }

    public function store(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
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
            'password_confirmation' => ['required', 'string', 'same:password'],
            'roles' => ['nullable'],
            'roles.*' => ['string', 'exists:roles,name'],
        ])->validate();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        if (!empty($validated['roles'])) {
            $user->assignRole($validated['roles']);
        }

        // Fire the UserRegistered event for Telegram notifications
        event(new \App\Events\UserRegistered($user));

        return to_route('users.index')->with("success", "User created successfully");
    }

    public function edit($id)
    {
        $user = User::with(['roles'])->find($id);
        $roles = Role::where('guard_name', 'web')->get(); // Admin panel uses web guard

        return Inertia::render('Users/CreateEdit', [
            'roles' => $roles,
            'user' => $user
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => [
                'nullable',
                'string',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'password_confirmation' => ['nullable', 'string', 'same:password'],
            'roles' => ['required', 'array'],
            'roles.*' => ['string', 'exists:roles,name'], // Accept role names, not IDs
        ])->validate();

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        // Only update password if provided
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        // Sync roles using role names
        $user->syncRoles($validated['roles']);

        return to_route('users.index')->with("success", "User updated successfully");
    }

    /**
     * Reset user password (Admin function - no confirmation required)
     */
    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = Validator::make($request->all(), [
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
        ])->validate();

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with("success", "Password reset successfully for user: " . $user->name);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Block user instead of deleting
        if ($user->isActive()) {
            $user->block('Blocked by admin');
            $message = "User blocked successfully";
        } else {
            $user->unblock();
            $message = "User unblocked successfully";
        }

        return to_route('users.index')->with("success", $message);
    }

    /**
     * Toggle user status between active and blocked
     */
    public function toggleStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent blocking the current user
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot block yourself.']);
        }

        $reason = $request->input('reason', 'Status changed by admin');

        if ($user->isActive()) {
            $user->block($reason);
            $message = "User {$user->name} has been blocked successfully";
        } else {
            $user->unblock();
            $message = "User {$user->name} has been unblocked successfully";
        }

        return back()->with("success", $message);
    }

    public function import(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls,csv'
        ]);

        try {
            Excel::import(new UsersImport, $request->file('excel_file'));
            return redirect()->back()->with('success', 'Users imported successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Error importing users: ' . $e->getMessage()]);
        }
    }

    /**
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function export(Request $request)
    {
        try {
            // Check if user is authenticated
            if (!Auth::check()) {
                Log::error('User not authenticated for export');
                return redirect()->route('login');
            }

            // Check if user has permission
            if (!Auth::user()->can('user-list')) {
                Log::error('User lacks permission for export');
                return back()->withErrors(['error' => 'You do not have permission to export users']);
            }

            $search = $request->input('search');
            $format = $request->input('format', 'xlsx'); // Default to Excel

            Log::info('Starting user export...', ['format' => $format, 'search' => $search]);

            if ($format === 'pdf') {
                // Generate PDF using the users PDF template
                $query = User::with('roles');

                // Apply search filter
                if ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', '%' . $search . '%')
                            ->orWhere('email', 'like', '%' . $search . '%');
                    });
                }

                $users = $query->get();

                $pdf = Pdf::loadView('pdf.users', compact('users', 'search'));
                $pdf->setPaper('A4', 'portrait');

                return $pdf->download('users-report-' . now()->format('Y-m-d') . '.pdf');
            }

            // Default Excel export
            return Excel::download(new UsersExport($search), 'users-' . now()->format('Y-m-d') . '.xlsx');
        } catch (\Exception $e) {
            Log::error('Export failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to export users: ' . $e->getMessage()]);
        }
    }

    /**
     * Get available agents for assignment
     */
    public function getAgents()
    {
        $agents = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['admin', 'manager', 'support']);
        })->select('id', 'name', 'email')->get();

        return response()->json($agents);
    }
}
