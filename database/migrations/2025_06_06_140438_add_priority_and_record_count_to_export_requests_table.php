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
        Schema::table('export_requests', function (Blueprint $table) {
            $table->string('priority')->default('normal')->after('status'); // normal, high, low
            $table->integer('record_count')->default(0)->after('priority'); // Number of records being exported
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('export_requests', function (Blueprint $table) {
            $table->dropColumn(['priority', 'record_count']);
        });
    }
};
