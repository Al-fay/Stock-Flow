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
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();

            $table->foreignId('unit_id')
                ->constrained('units')
                ->noActionOnDelete();

            $table->string('sku', 50)->unique();
            $table->string('barcode', 100)->nullable()->unique();
            $table->string('name', 200);
            $table->text('description')->nullable();

            $table->decimal('purchase_price', 18, 2)->default(0);
            $table->decimal('selling_price', 18, 2)->default(0);

            // Saldo stok saat ini
            $table->decimal('stock', 18, 3)->default(0);

            // Batas minimum stok
            $table->decimal('minimum_stock', 18, 3)->default(0);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('category_id');
            $table->index('is_active');
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
