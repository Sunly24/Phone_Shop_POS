<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('telegrams', function (Blueprint $table) {
            // Add customer_id column if it doesn't exist
            if (!Schema::hasColumn('telegrams', 'customer_id')) {
                $table->bigInteger('customer_id')->nullable()->after('user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('telegrams', function (Blueprint $table) {
            // Drop the column if it exists
            if (Schema::hasColumn('telegrams', 'customer_id')) {
                $table->dropColumn('customer_id');
            }
        });
    }
};
