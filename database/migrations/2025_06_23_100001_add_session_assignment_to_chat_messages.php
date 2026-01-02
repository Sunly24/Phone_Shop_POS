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
            $table->unsignedBigInteger('assigned_to')->nullable()->after('support_user_id');
            $table->timestamp('assigned_at')->nullable()->after('assigned_to');
            $table->enum('assignment_status', ['unassigned', 'assigned', 'auto-assigned'])->default('unassigned')->after('assigned_at');

            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            $table->index(['session_id', 'assigned_to']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropIndex(['session_id', 'assigned_to']);
            $table->dropColumn(['assigned_to', 'assigned_at', 'assignment_status']);
        });
    }
};
