<?php

namespace App\Imports;

use App\Models\User;
use Spatie\Permission\Models\Role;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class UsersImport implements ToModel, WithHeadingRow, WithValidation
{
    protected $defaultRole = 'User';

    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        try {
            // Create the user first
            $user = User::create([
                'name'     => $row['name'],
                'email'    => $row['email'],
                'password' => bcrypt($row['password']),
            ]);

            // Handle role assignment
            if (isset($row['role'])) {
                $role = Role::where('name', $row['role'])->first();

                if ($role) {
                    // Assign the specified role if it exists
                    $user->assignRole($role);
                } else {
                    // If role doesn't exist, assign the default role
                    Log::warning("Role '{$row['role']}' not found for user {$row['email']}, assigning default role '{$this->defaultRole}'");
                    $defaultRole = Role::where('name', $this->defaultRole)->first();
                    if ($defaultRole) {
                        $user->assignRole($defaultRole);
                    }
                }
            } else {
                // If no role specified, assign default role
                $defaultRole = Role::where('name', $this->defaultRole)->first();
                if ($defaultRole) {
                    $user->assignRole($defaultRole);
                }
            }

            // Fire the UserRegistered event for Telegram notifications
            event(new \App\Events\UserRegistered($user));

            return $user;
        } catch (\Exception $e) {
            Log::error("Error importing user {$row['email']}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * @return array
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
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
            'role' => 'nullable|string'  // Remove the exists:roles,name validation
        ];
    }
}
