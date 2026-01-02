<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix support messages that incorrectly have customer user information
        // Support messages should not have user_name, user_email, etc. 
        // Those fields should only be populated for user messages

        DB::statement("
            UPDATE chat_messages 
            SET 
                user_id = NULL,
                user_name = NULL,
                user_email = NULL,
                user_phone = NULL
            WHERE sender = 'support'
        ");

        // Ensure all messages in each session have correct assignment information
        // Update assigned_to based on support_user_id for support messages
        DB::statement("
            UPDATE chat_messages cm1
            JOIN (
                SELECT 
                    session_id,
                    MAX(support_user_id) as latest_support_user,
                    MAX(CASE WHEN assignment_status IS NOT NULL THEN assigned_to END) as session_assigned_to
                FROM chat_messages 
                WHERE sender = 'support' AND support_user_id IS NOT NULL
                GROUP BY session_id
            ) session_support ON cm1.session_id = session_support.session_id
            SET 
                cm1.assigned_to = COALESCE(session_support.session_assigned_to, session_support.latest_support_user),
                cm1.assignment_status = COALESCE(cm1.assignment_status, 'assigned')
            WHERE cm1.assigned_to IS NULL OR cm1.assignment_status IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration cannot be reversed as it fixes data integrity
        // We don't want to reintroduce incorrect user information on support messages
    }
};
