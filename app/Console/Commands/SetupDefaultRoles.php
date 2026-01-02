<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class SetupDefaultRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'setup:roles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup default roles and permissions for the application';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Setting up default roles and permissions...');

        // Create permissions if they don't exist
        $permissions = [
            // Public permissions (for regular users)
            'view-public-pages',
            'view-profile',

            // Admin permissions (existing)
            'product-list',
            'product-create',
            'product-edit',
            'product-delete',
            'customer-list',
            'customer-create',
            'customer-edit',
            'customer-delete',
            'category-list',
            'category-create',
            'category-edit',
            'category-delete',
            'brand-list',
            'brand-create',
            'brand-edit',
            'brand-delete',
            'maker-list',
            'maker-create',
            'maker-edit',
            'maker-delete',
            'size-list',
            'size-create',
            'size-edit',
            'size-delete',
            'color-list',
            'color-create',
            'color-edit',
            'color-delete',
            'order-list',
            'order-create',
            'order-edit',
            'order-delete',
            'invoice-list',
            'invoice-create',
            'invoice-edit',
            'invoice-delete',
            'user-list',
            'user-create',
            'user-edit',
            'user-delete',
            'role-list',
            'role-create',
            'role-edit',
            'role-delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'api' // API guard for command-created permissions
            ]);
        }

        $this->info('Permissions created/verified.');

        // Create User role (for regular registered users)
        $userRole = Role::firstOrCreate([
            'name' => 'User',
            'guard_name' => 'api' // API guard for user registrations
        ]);

        // Assign basic permissions to User role
        $userPermissions = [
            'view-public-pages',
            'view-profile'
        ];

        $userRole->syncPermissions($userPermissions);
        $this->info('User role created with basic permissions.');

        // Create Admin role (for admin users)
        $adminRole = Role::firstOrCreate([
            'name' => 'Admin',
            'guard_name' => 'api' // API guard for API admin access
        ]);

        // Assign all permissions to Admin role
        $adminPermissions = array_filter($permissions, function ($permission) {
            return $permission !== 'view-public-pages'; // Admin doesn't need this explicitly
        });

        $adminRole->syncPermissions($adminPermissions);
        $this->info('Admin role created with full permissions.');

        // Create Manager role (optional)
        $managerRole = Role::firstOrCreate([
            'name' => 'Manager',
            'guard_name' => 'api' // API guard for API manager access
        ]);

        // Assign most permissions to Manager role (except user/role management)
        $managerPermissions = array_filter($permissions, function ($permission) {
            return !in_array($permission, ['user-list', 'user-create', 'user-edit', 'user-delete', 'role-list', 'role-create', 'role-edit', 'role-delete']);
        });

        $managerRole->syncPermissions($managerPermissions);
        $this->info('Manager role created with limited admin permissions.');

        $this->info('✅ Setup complete! Default roles and permissions have been created.');
        $this->info('');
        $this->info('Roles created:');
        $this->info('- User: Basic permissions for registered users');
        $this->info('- Manager: Limited admin permissions');
        $this->info('- Admin: Full admin permissions');
        $this->info('');
        $this->info('New registrations will automatically get the "User" role.');
    }
}
