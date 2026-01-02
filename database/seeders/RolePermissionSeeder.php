<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
  /**
   * Create roles and assign permissions for hybrid guard system.
   * 
   * WEB GUARD: Admin panel (session-based)
   * API GUARD: API endpoints (token-based)
   */
  public function run(): void
  {
    $this->command->info('🔧 Creating roles and assigning permissions...');

    // ============================================
    // CREATE ESSENTIAL ROLES
    // ============================================

    // Web Guard Roles (Admin Panel)
    $webAdmin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
    $webManager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);

    // API Guard Roles (API Access) 
    $apiAdmin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'api']);
    $apiUser = Role::firstOrCreate(['name' => 'User', 'guard_name' => 'api']);

    $this->command->info('✅ Roles created for web and api guards');

    // ============================================
    // ASSIGN PERMISSIONS TO ROLES
    // ============================================

    // Get all permissions for each guard
    $webPermissions = Permission::where('guard_name', 'web')->get();
    $apiPermissions = Permission::where('guard_name', 'api')->get();

    // Web Admin: Full access to admin panel
    $webAdmin->syncPermissions($webPermissions);

    // API Admin: Full API access
    $apiAdmin->syncPermissions($apiPermissions);

    // Web Manager: Limited admin panel access (no user/role deletion)
    $managerPermissions = $webPermissions->reject(function ($permission) {
      return in_array($permission->name, ['user-delete', 'role-delete']);
    });
    $webManager->syncPermissions($managerPermissions);

    // API User: Basic API access (only list and create)
    $basicApiPermissions = $apiPermissions->filter(function ($permission) {
      return str_contains($permission->name, '-list') ||
        str_contains($permission->name, '-create');
    });
    $apiUser->syncPermissions($basicApiPermissions);

    // ============================================
    // SUMMARY
    // ============================================
    $this->command->info('✅ Permissions assigned:');
    $this->command->info("   Web Admin: {$webPermissions->count()} permissions");
    $this->command->info("   Web Manager: {$managerPermissions->count()} permissions");
    $this->command->info("   API Admin: {$apiPermissions->count()} permissions");
    $this->command->info("   API User: {$basicApiPermissions->count()} permissions");
  }
}
