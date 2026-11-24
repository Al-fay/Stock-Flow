<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StockMovementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = Product::all();
        $suppliers = Supplier::all();

        foreach ($products as $index => $product) {
            // Initial stock
            StockMovement::updateOrCreate(
                ['reference_number' => 'INIT-' . $product->sku],
                [
                    'product_id' => $product->id,
                    'supplier_id' => $suppliers[$index % $suppliers->count()]->id,
                    'user_id' => 1,
                    'movement_type' => 'in',
                    'quantity' => 100,
                    'notes' => 'Initial stock opname.',
                ]
            );

            // Stock in
            StockMovement::updateOrCreate(
                ['reference_number' => 'IN-' . $product->sku],
                [
                    'product_id' => $product->id,
                    'supplier_id' => $suppliers[$index % $suppliers->count()]->id,
                    'user_id' => 1,
                    'movement_type' => 'in',
                    'quantity' => 50,
                    'notes' => 'Restock from supplier.',
                ]
            );

            // Stock out
            StockMovement::updateOrCreate(
                ['reference_number' => 'OUT-' . $product->sku],
                [
                    'product_id' => $product->id,
                    'supplier_id' => null,
                    'user_id' => 1,
                    'movement_type' => 'out',
                    'quantity' => 30,
                    'notes' => 'Stock issued for customer orders.',
                ]
            );
        }
    }
}
