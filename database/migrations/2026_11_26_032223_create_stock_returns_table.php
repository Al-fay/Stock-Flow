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
        Schema::create('stock_returns', function (Blueprint $table) {
            $table->id();

            $table->string('reference_number', 50)->unique();

            $table->foreignId('stock_out_id')
                ->constrained('stock_outs')
                ->restrictOnDelete();

            $table->date('return_date');

            $table->decimal('total_quantity', 18, 3)->default(0);

            $table->decimal('total_amount', 18, 2)->default(0);

            $table->string('status', 20)->default('POSTED');

            $table->text('reason')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('return_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_returns');
    }
};
