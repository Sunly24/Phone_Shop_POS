<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        DB::table('audits')->truncate();
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        // Cannot restore truncated data
    }
};
