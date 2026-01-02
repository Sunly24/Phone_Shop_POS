<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

use function Laravel\Prompts\table;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id('product_id')->comment('Product ID');
            $table->string('product_title');
            $table->string('product_description');
            $table->string('product_code');
            $table->double('product_price');
            $table->integer('product_stock');
            $table->integer('product_ram');
            $table->boolean('product_status')->default(1);
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('brand_id')->nullable()->constrained('brands', 'brand_id')->onDelete('cascade');
            $table->foreignId('maker_id')->nullable()->constrained('makers', 'maker_id')->onDelete('cascade');
            $table->foreignId('size_id')->nullable()->constrained('sizes', 'size_id')->onDelete('cascade');
            $table->foreignId('color_id')->nullable()->constrained('colors', 'color_id')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
