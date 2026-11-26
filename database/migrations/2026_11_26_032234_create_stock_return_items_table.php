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
        Schema::create('stock_return_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('stock_return_id')
                ->constrained('stock_returns')
                ->cascadeOnDelete();

            $table->foreignId('stock_out_item_id')
                ->constrained('stock_out_items')
                ->restrictOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();

            $table->decimal('quantity', 18, 3);

            $table->decimal('unit_price', 18, 2)->default(0);

            $table->decimal('subtotal', 18, 2)->default(0);

            $table->decimal('restock_quantity', 18, 3)->default(0);

            $table->decimal('damaged_quantity', 18, 3)->default(0);

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('stock_out_item_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_return_items');
    }
};
