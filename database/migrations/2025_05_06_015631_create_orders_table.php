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
        Schema::create('orders', function (Blueprint $table) {
            $table->id('order_id');                        
            $table->foreignId('customer_id')                
                  ->constrained('customers', 'customer_id')
                  ->onDelete('cascade');
            $table->foreignId('user_id')                   
                  ->constrained('users', 'id')
                  ->onDelete('cascade');
            $table->decimal('sub_total', 10, 2);            
            $table->decimal('discount', 10, 2);         
            $table->decimal('total', 10, 2);              
            $table->decimal('total_payment', 10, 2);  
            $table->string('md5_hash')->nullable()->unique();
            $table->string('currency', 3)->default('USD');
            $table->boolean('is_paid')->default(false); 
            $table->string('payment_method')->default('Cash');    
            $table->timestamps();   
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
