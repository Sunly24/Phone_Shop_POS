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
        Schema::create('k_h_q_r_s', function (Blueprint $table) {
        $table->id();
        $table->string('bill_number')->unique();
        $table->string('payload');
        $table->string('md5');
        $table->string('qr_url');
        $table->decimal('amount', 12, 2);
        $table->string('currency', 10);
        $table->string('status')->default('PENDING'); 
        $table->string('transaction_id')->nullable();
        $table->unsignedBigInteger('order_id')->nullable();
        $table->foreign('order_id')->references('order_id')->on('orders')->onDelete('set null');
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('k_h_q_r_s');
    }
};
