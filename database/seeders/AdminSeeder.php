<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
  /**
   * Create admin user and assign web Admin role.
   */
  public function run(): void
  {
    $this->command->info('👤 Creating admin user...');

    // Create or update admin user
    $admin = User::updateOrCreate(
      ['email' => 'admin@gmail.com'],
      [
        'name' => 'admin',
        'password' => Hash::make('password'),
        'email_verified_at' => now(),
      ]
    );

    // Assign web Admin role (for dashboard access)
    $admin->syncRoles(['Admin']); // Uses web guard by default

    $this->command->info('✅ Admin user configured:');
    $this->command->info('   Email: admin@gmail.com');
    $this->command->info('   Password: password');
    $this->command->info('   Role: Admin (web guard)');
    $this->command->info('   Permissions: ' . $admin->getAllPermissions()->count());

    // Verify critical permissions
    $criticalPerms = ['user-list', 'role-list', 'product-list'];
    foreach ($criticalPerms as $perm) {
      $status = $admin->can($perm) ? '✅' : '❌';
      $this->command->info("   {$status} {$perm}");
    }
  }
}
