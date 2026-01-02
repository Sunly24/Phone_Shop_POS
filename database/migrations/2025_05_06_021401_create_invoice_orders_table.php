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
        Schema::create('invoice_orders', function (Blueprint $table) {
            $table->id('invoice_order_id')
                ->comment('Invoice Order ID');
            $table->foreignId('invoice_id')
                ->constrained('invoices', 'invoice_id');
            $table->foreignId('order_id')
                ->constrained('orders', 'order_id');
            $table->decimal('total', 10, 2);
            $table->decimal('sub_total', 10, 2)->default(0);
            $table->decimal('discount', 10, 2);      
            $table->foreignId('product_id')                 
                  ->constrained('products', 'product_id')
                  ->onDelete('cascade');
            $table->string('product_code');               
            $table->string('product_title');               
            $table->decimal('product_price', 10, 2);   
            $table->integer('quantity');  
            $table->string('product_color')->nullable();
            $table->string('product_ram')->nullable();   
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_orders');
    }
};
