<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained('orders', 'order_id')->onDelete('set null'); 
            $table->foreignId('product_id')->references('product_id')->on('products')->onDelete('cascade');
            $table->string('product_title')->nullable();             
            $table->decimal('product_price', 10, 2)->nullable();   
            $table->integer('product_stock')->default(0);                 
            $table->integer('quantity_booked')->default(0);         
            $table->timestamp('last_restocked_at')->nullable();      
            $table->unsignedBigInteger('last_updated_by')->nullable();  
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
