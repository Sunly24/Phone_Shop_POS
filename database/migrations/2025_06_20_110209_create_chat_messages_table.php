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
    Schema::create('chat_messages', function (Blueprint $table) {
      $table->id();
      $table->string('session_id')->index(); // To group messages by session
      $table->text('message');
      $table->enum('sender', ['user', 'support'])->default('user');
      $table->string('user_name')->nullable(); // For guest users
      $table->string('user_email')->nullable(); // For guest users
      $table->string('user_phone')->nullable(); // For guest users
      $table->unsignedBigInteger('user_id')->nullable(); // For authenticated users
      $table->unsignedBigInteger('support_user_id')->nullable(); // Admin who replied
      $table->boolean('is_read')->default(false);
      $table->enum('status', ['pending', 'answered', 'closed'])->default('pending');
      $table->timestamp('read_at')->nullable();
      $table->timestamps();

      $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
      $table->foreign('support_user_id')->references('id')->on('users')->onDelete('set null');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('chat_messages');
  }
};
