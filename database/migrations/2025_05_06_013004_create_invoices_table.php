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
        Schema::create('invoices', function (Blueprint $table) {
            $table->unsignedBigInteger('order_id');
            $table->id('invoice_id')->comment('Invoices ID');
            $table->foreignId('customer_id');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('sub_total', 10, 2)->default(0);
            $table->boolean('is_paid')->default(false);
            $table->string('currency', 3)->default('USD');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
