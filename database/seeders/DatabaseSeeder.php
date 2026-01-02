<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * 
     * Clean, minimal seeder setup for hybrid guard system.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting database seeding...');
        $this->command->newLine();

        $this->call([
            PermissionSeeder::class,        // 1. Create all permissions
            RolePermissionSeeder::class,    // 2. Create roles and assign permissions  
            AdminSeeder::class,             // 3. Create admin user
        ]);

        $this->command->newLine();
        $this->command->info('🎉 Database seeding completed!');
        $this->command->info('📱 Admin dashboard ready');
        $this->command->info('🔌 API system ready');
    }
}
