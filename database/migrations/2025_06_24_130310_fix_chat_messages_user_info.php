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
        // Fix existing chat messages that have NULL user information
        // This migration will update support messages to include user info from the session

        DB::statement("
            UPDATE chat_messages cm1 
            JOIN (
                SELECT 
                    session_id,
                    MAX(CASE WHEN sender = 'user' AND user_name IS NOT NULL THEN user_name END) as session_user_name,
                    MAX(CASE WHEN sender = 'user' AND user_email IS NOT NULL THEN user_email END) as session_user_email,
                    MAX(CASE WHEN sender = 'user' AND user_phone IS NOT NULL THEN user_phone END) as session_user_phone,
                    MAX(CASE WHEN sender = 'user' AND user_id IS NOT NULL THEN user_id END) as session_user_id
                FROM chat_messages 
                WHERE sender = 'user'
                GROUP BY session_id
            ) session_info ON cm1.session_id = session_info.session_id
            SET 
                cm1.user_name = COALESCE(cm1.user_name, session_info.session_user_name),
                cm1.user_email = COALESCE(cm1.user_email, session_info.session_user_email),
                cm1.user_phone = COALESCE(cm1.user_phone, session_info.session_user_phone),
                cm1.user_id = COALESCE(cm1.user_id, session_info.session_user_id)
            WHERE (cm1.user_name IS NULL OR cm1.user_email IS NULL OR cm1.user_id IS NULL)
        ");

        // Also try to get user info from the users table if user_id exists but names are missing
        DB::statement("
            UPDATE chat_messages cm
            JOIN users u ON cm.user_id = u.id
            SET 
                cm.user_name = COALESCE(cm.user_name, u.name),
                cm.user_email = COALESCE(cm.user_email, u.email)
            WHERE (cm.user_name IS NULL OR cm.user_email IS NULL) AND cm.user_id IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration cannot be reversed as it fixes data consistency
        // We don't want to remove user information that was correctly filled
    }
};
