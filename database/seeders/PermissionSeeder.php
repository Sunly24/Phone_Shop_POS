<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates permissions for HYBRID GUARD approach:
     * - WEB guard: Admin panel, dashboard access (session-based)
     * - API guard: API endpoints, mobile apps (token-based)
     */
    public function run(): void
    {
        // All permissions for the phone shop system
        $permissions = [
            // Role & User Management (Admin functions)
            'role-list',
            'role-create',
            'role-edit',
            'role-delete',

            'user-list',
            'user-create',
            'user-edit',
            'user-delete',

            // Product Catalog Management
            'category-list',
            'category-create',
            'category-edit',
            'category-delete',

            'subcategory-list',
            'subcategory-create',
            'subcategory-edit',
            'subcategory-delete',

            'product-list',
            'product-create',
            'product-edit',
            'product-delete',

            'product-image-list',
            'product-image-create',
            'product_image-edit',
            'product-image-delete',

            // Inventory & Stock Management
            'inventory-list',
            'inventory-create',
            'inventory-edit',
            'inventory-delete',

            // Order Management
            'order-list',
            'order-create',
            'order-edit',
            'order-delete',

            'orderItem-list',
            'orderItem-create',
            'orderItem-edit',
            'orderItem-delete',

            // Invoice Management
            'invoice-list',
            'invoice-create',
            'invoice-edit',
            'invoice-delete',

            'invoiceOrder-list',
            'invoiceOrder-create',
            'invoiceOrder-edit',
            'invoiceOrder-delete',

            // Customer Management
            'customer-list',
            'customer-create',
            'customer-edit',
            'customer-delete',

            // Product Attributes
            'color-list',
            'color-create',
            'color-edit',
            'color-delete',

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

            // System Management
            'activity-log-list',
            'verify-list',

            // Customer Support
            'chat-list',
            'chat-reply',
            'chat-edit',
            'chat-delete',
        ];

        // Create permissions for BOTH guards (hybrid approach)
        foreach ($permissions as $permission) {
            foreach (['web', 'api'] as $guard) {
                $existingPermission = Permission::where('name', $permission)
                    ->where('guard_name', $guard)
                    ->first();

                if (!$existingPermission) {
                    Permission::create([
                        'name' => $permission,
                        'guard_name' => $guard
                    ]);
                }
            }
        }

        $this->command->info("✅ Created permissions for both WEB and API guards");
        $this->command->info("📱 WEB guard: Admin panel access (session-based)");
        $this->command->info("🔌 API guard: API endpoints access (token-based)");
        $this->command->info("🔑 Total permissions per guard: " . count($permissions));
    }
}
