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
        Schema::create('stock_outs', function (Blueprint $table) {
            $table->id();

            $table->string('reference_number', 50)->unique();

            $table->date('transaction_date');

            $table->string('transaction_type', 20)
                ->default('OTHER');

            $table->string('destination', 150)->nullable();

            $table->decimal('total_quantity', 18, 3)
                ->default(0);

            $table->decimal('total_amount', 18, 2)
                ->default(0);

            $table->string('status', 20)
                ->default('POSTED');

            $table->text('notes')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('transaction_date');
            $table->index('transaction_type');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_outs');
    }
};
