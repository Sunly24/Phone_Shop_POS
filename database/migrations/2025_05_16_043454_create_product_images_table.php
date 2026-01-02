<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductImagesTable extends Migration
{
    public function up()
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id('product_image_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('color_id')->nullable();
            $table->string('image_path');
            $table->string('image_name');
            $table->integer('image_size');
            $table->string('image_type');
            $table->timestamps();

            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
            $table->foreign('color_id')->references('color_id')->on('colors')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_images');
    }
}