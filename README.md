# 📱 Phone Shop - Laravel Application

> **A complete phone shop management system with hybrid authentication, role-based permissions, and API support.**

## 🚀 Quick Start

### Installation
```bash
# Step 1: Install dependencies
composer install
npm install

# Step 2: Environment setup
cp .env.example .env
php artisan key:generate
php artisan jwt:secret

# Step 3: Database setup
php artisan migrate
php artisan db:seed

# Step 4: Start development
php artisan serve
npm run dev
```

---

## 🔒 Authentication System - Hybrid Guard Approach

### ✅ **Problem Solved**
The admin permissions issue has been **completely resolved** using a **Hybrid Guard Approach**!

### 🏗️ **Architecture Overview**

#### **WEB GUARD** (`auth:web`) - Admin Panel
- **Purpose**: Admin dashboard, management interface
- **Authentication**: Session-based (cookies)
- **Perfect for**: Admin users, managers, staff
- **Features**: Persistent login, CSRF protection, perfect UX

#### **API GUARD** (`auth:sanctum`) - API Access
- **Purpose**: API endpoints, mobile apps, integrations
- **Authentication**: Token-based (stateless)
- **Perfect for**: Mobile apps, external services, API consumers
- **Features**: Scalable, secure, token management

### 📋 **Current Setup**

#### **Roles Created**
```
WEB GUARD:
✅ Admin (70 permissions) - Full admin panel access
✅ Manager (68 permissions) - Limited admin access

API GUARD:
✅ Admin (70 permissions) - Full API access
✅ User (35 permissions) - Basic API access
```

#### **Admin User Configuration**
```
Email: admin@gmail.com
Password: password
Role: Admin (WEB guard)
Permissions: 70 total
Status: ✅ FULLY FUNCTIONAL
```

### 🛣️ **Route Structure**

#### **Web Routes** (`routes/web.php`)
```php
Route::middleware(['auth:web'])->group(function () {
    // Dashboard
    Route::get('/dashboard', /*...*/);
    
    // Admin resources with permissions
    Route::prefix('users')->middleware('check:user-list')->group(/*...*/);
    Route::prefix('roles')->middleware('check:role-list')->group(/*...*/);
    Route::prefix('products')->middleware('check:product-list')->group(/*...*/);
    // ... all other admin routes
});
```

#### **API Routes** (`routes/api.php`)
```php
Route::middleware(['auth'])->group(function () {
    // API endpoints use Sanctum by default
    Route::prefix('users')->group(/*...*/);
    Route::prefix('auth')->group(/*...*/);
    // ... all API endpoints
});
```

---

## 🧹 Database Seeder System

### **Clean Seeder Structure (3 Essential Seeders)**

#### **1. PermissionSeeder.php**
**Purpose**: Creates all permissions for hybrid guard system
- ✅ Creates 70+ permissions covering all phone shop features
- ✅ Duplicates each permission for both 'web' and 'api' guards
- ✅ Covers: Products, Orders, Users, Roles, Inventory, Customers, Chat, etc.

#### **2. RolePermissionSeeder.php**
**Purpose**: Creates roles and assigns appropriate permissions
- **WEB GUARD**: Admin (70 permissions), Manager (68 permissions)
- **API GUARD**: Admin (70 permissions), User (35 permissions)

#### **3. AdminSeeder.php**
**Purpose**: Creates admin user with proper role assignment
- ✅ Email: admin@gmail.com
- ✅ Password: password
- ✅ Role: Admin (web guard)
- ✅ Full dashboard permissions verified

### **Seeder Commands**

#### **Full System Setup**
```bash
php artisan migrate:fresh --seed
```

#### **Individual Seeders**
```bash
# Update permissions only
php artisan db:seed --class=PermissionSeeder

# Update roles and permissions
php artisan db:seed --class=RolePermissionSeeder

# Update admin user only
php artisan db:seed --class=AdminSeeder
```

---

## 📊 Guard Configuration Audit

### **Current Guard Distribution**

#### **WEB GUARD** (`guard_name: 'web'`)
**Purpose**: Admin panel access (session-based authentication)
- **Roles**: 2 (Admin, Manager)
- **Permissions**: 70 (complete set)
- **Used By**: RolesController, UserController, Admin users

#### **API GUARD** (`guard_name: 'api'`)
**Purpose**: API access (token-based authentication via Sanctum)
- **Roles**: 2 (Admin, User)
- **Permissions**: 70 (complete set)
- **Used By**: API endpoints, Mobile applications, New user registrations

### **Guard Usage Rules**

#### **Web Guard Usage**
```php
// ✅ Correct - Admin panel controllers
Role::where('guard_name', 'web')->get()
Permission::where('guard_name', 'web')->get()
Role::create(['guard_name' => 'web'])
```

#### **API Guard Usage**
```php
// ✅ Correct - API controllers and user registration
Role::where('guard_name', 'api')->get()
Permission::where('guard_name', 'api')->get()
Role::create(['guard_name' => 'api'])
```

---

## 🎯 System Features

### **Admin Dashboard**
✅ Complete user management with role-based permissions  
✅ Product catalog management (categories, brands, sizes, colors)  
✅ Order and invoice management  
✅ Inventory tracking  
✅ Customer management  
✅ Real-time chat support  
✅ Audit logging with export functionality  
✅ Multi-format export (PDF, Excel, CSV) - See `EXPORT_FEATURES.md`  
✅ Automated export system with cron jobs - See `CRON_EXPORT_SYSTEM.md`  

### **API System**
✅ RESTful API endpoints  
✅ Token-based authentication  
✅ Mobile app ready  
✅ Third-party integration support  
✅ Rate limiting and security  

---

## 🔧 Development Commands

### **Database**
```bash
# Fresh migration with seeders
php artisan migrate:fresh --seed

# Add new table or column
php artisan migrate

# Delete all table data
php artisan migrate:refresh

# Delete specific table data
php artisan migrate:refresh --path="database/migrations/specific_migration.php"
```

### **Cache Management**
```bash
# Clear all caches
php artisan optimize:clear

# Individual cache clearing
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear

# Cache optimization for production
php artisan route:cache
php artisan config:cache
php artisan view:cache
```

### **Queue Management**
```bash
# Run the queue worker
php artisan queue:work

# Run specific queue
php artisan queue:work --queue=high,default
```

### **Code Generation**
```bash
# Generate model with migration, controller, and resource
php artisan make:model YourModelName -mcr

# Generate seeder
php artisan make:seeder YourSeederName

# Generate middleware
php artisan make:middleware YourMiddlewareName
```

---

## 🎊 Final System Status

### **✅ FULLY OPERATIONAL**

#### **Admin Dashboard**
✅ Can access roles management  
✅ Can see all 70 permissions  
✅ Can create/edit web guard roles  
✅ Role filtering works correctly  
✅ All CRUD operations functional  

#### **API System**
✅ New users get API User role  
✅ API authentication ready  
✅ Proper permission structure  
✅ Mobile app integration ready  

#### **Security**
✅ No guard conflicts  
✅ Proper separation of concerns  
✅ Clean role/permission structure  
✅ Production-ready configuration  

---

## 📱 Usage Examples

### **Admin Access**
1. Navigate to `/login`
2. Use credentials: `admin@gmail.com` / `password`
3. Access dashboard with full permissions
4. Manage users, roles, products, orders, etc.

### **API Access**
1. **Login**: `POST /api/auth/login`
2. **Get Token**: Use token for subsequent requests
3. **API Calls**: Include `Authorization: Bearer {token}`
4. **Logout**: `POST /api/auth/logout`

---

## 🛠️ Troubleshooting

### **Common Issues**

#### **"No application encryption key"**
```bash
php artisan key:generate
```

#### **Permission denied errors**
```bash
sudo chown -R $USER:www-data storage
sudo chown -R $USER:www-data bootstrap/cache
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

#### **Role/Permission issues**
```bash
# Reset permissions and roles
php artisan migrate:fresh --seed
```

#### **Cache issues**
```bash
php artisan optimize:clear
```

---

## 📚 Project Structure

```
app/
├── Http/Controllers/     # All controllers
├── Models/              # Eloquent models
├── Services/            # Business logic
├── Events/              # Event classes
├── Listeners/           # Event listeners
├── Jobs/                # Queue jobs
├── Console/Commands/    # Artisan commands
└── Middleware/          # Custom middleware

database/
├── migrations/          # Database schema
├── seeders/            # Database seeders
└── factories/          # Model factories

resources/
├── js/                 # React/Inertia components
├── views/              # Blade templates
└── css/                # Stylesheets

routes/
├── web.php             # Web routes (admin panel)
├── api.php             # API routes
└── auth.php            # Authentication routes
```

---

**Last Updated**: June 30, 2025  
**Status**: ✅ PRODUCTION READY  
**Authentication**: 🔒 HYBRID GUARD SYSTEM  
**API**: 📱 MOBILE READY
