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
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->string('ip_address')->nullable()->after('user_phone');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->index(['session_id', 'ip_address']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropIndex(['session_id', 'ip_address']);
            $table->dropColumn(['ip_address', 'user_agent']);
        });
    }
};
