<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Http\Controllers\Controller;

class RolesController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Role::where('guard_name', 'web'); // Admin panel uses web guard

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query->orderBy('id', 'asc')
            ->paginate(10)
            ->appends($request->only('search'));

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create()
    {
        $permissions = Permission::where('guard_name', 'web')->get(); // Admin panel uses web guard

        return Inertia::render('Roles/CreateEdit', [
            'permissions' => $permissions
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'min:3',
                Rule::unique('roles', 'name')->where('guard_name', 'web'),
            ],
            'permissions' => 'nullable|array'
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web' // Admin panel uses web guard
        ]);

        if (!empty($validated['permissions'])) {
            $permissions = Permission::whereIn("id", $validated['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        return to_route('roles.index')->with("success", "Role added successfully");
    }

    public function show($id)
    {
        $role = Role::where('guard_name', 'web')->with(['permissions'])->findOrFail($id);

        return Inertia::render('Roles/Show', [
            'role' => $role
        ]);
    }

    public function edit($id)
    {
        $role = Role::where('guard_name', 'web')->with(['permissions'])->findOrFail($id); // Admin panel uses web guard

        $permissions = Permission::where('guard_name', 'web')->get(); // Admin panel uses web guard

        return Inertia::render('Roles/CreateEdit', [
            'role' => $role,
            'permissions' => $permissions
        ]);
    }

    public function update(Request $request, $id)
    {
        $role = Role::where('guard_name', 'web')->findOrFail($id); // Ensure we're working with web guard only

        $validated = $request->validate([
            'name' => [
                'required',
                'min:3',
                Rule::unique('roles', 'name')
                    ->ignore($role->id)
                    ->where('guard_name', 'web'), // Only check uniqueness within web guard
            ],
            'permissions' => 'nullable|array'
        ]);

        $role->name = $validated['name'];
        $role->save();

        if (!empty($validated['permissions'])) {
            $permissions = Permission::whereIn("id", $validated['permissions'])->pluck('name');
            $role->syncPermissions($permissions);
        } else {
            // Clear all permissions if none are selected
            $role->syncPermissions([]);
        }

        return to_route('roles.index')->with("success", "Role updated successfully");
    }

    public function destroy($id)
    {
        try {
            $role = Role::findById($id, 'web'); // Admin panel uses web guard
            if (!$role) {
                return to_route('roles.index')->with("error", "Role not found");
            }

            $role->delete();
            return to_route('roles.index')->with("success", "Role Deleted successfully");
        } catch (\Exception $e) {
            return to_route('roles.index')->with("error", "Failed to delete role");
        }
    }
}
