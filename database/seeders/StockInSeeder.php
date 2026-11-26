<?php

namespace Database\Seeders;

use App\Models\StockIn;
use App\Models\StockInItem;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StockInSeeder extends Seeder
{
    public function run(): void
    {
        if (StockIn::exists()) {
            $this->command->info('StockInSeeder dilewati: data sudah ada.');
            return;
        }

        $products = Product::query()
            ->where('is_active', true)
            ->get();

        $suppliers = Supplier::all();
        $user = User::first();

        if ($products->isEmpty() || $suppliers->isEmpty() || !$user) {
            $this->command->warn('StockInSeeder dilewati: master data belum tersedia.');
            return;
        }

        DB::transaction(function () use ($products, $suppliers, $user) {
            for ($i = 1; $i <= 5; $i++) {
                $items = $products->random(min(3, $products->count()));

                $stockIn = StockIn::create([
                    'reference_number' => 'SI-SEED-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'supplier_id' => $suppliers->random()->id,
                    'transaction_date' => now()->subDays($i),
                    'total_quantity' => 0,
                    'total_amount' => 0,
                    'status' => 'POSTED',
                    'notes' => 'Data penerimaan barang dummy',
                    'created_by' => $user->id,
                ]);

                $totalQty = 0;
                $totalAmount = 0;

                foreach ($items as $product) {
                    $qty = rand(5, 20);
                    $cost = (float) $product->purchase_price;
                    $subtotal = $qty * $cost;

                    StockInItem::create([
                        'stock_in_id' => $stockIn->id,
                        'product_id' => $product->id,
                        'quantity' => $qty,
                        'unit_cost' => $cost,
                        'subtotal' => $subtotal,
                    ]);

                    $totalQty += $qty;
                    $totalAmount += $subtotal;
                }

                $stockIn->update([
                    'total_quantity' => $totalQty,
                    'total_amount' => $totalAmount,
                ]);
            }
        });

        $this->command->info('StockInSeeder berhasil.');
    }
}
