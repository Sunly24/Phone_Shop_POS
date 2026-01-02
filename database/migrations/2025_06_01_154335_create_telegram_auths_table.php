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
        Schema::create('telegram_auths', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->string('app_key');
            $table->string('chat_id');
            $table->string('chatBotID');
            $table->string('username');
            $table->string('url_redirect')->nullable();
            $table->string('webhook_url')->nullable();
            $table->boolean('webhook_configured')->default(false);
            $table->timestamp('webhook_configured_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telegram_auths');
    }
};
