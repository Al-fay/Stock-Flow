<?php

namespace Database\Seeders;

use App\Models\StockOut;
use App\Models\StockOutItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StockOutSeeder extends Seeder
{
    public function run(): void
    {
        if (StockOut::exists()) {
            $this->command->info('StockOutSeeder dilewati: data sudah ada.');
            return;
        }

        $products = Product::query()
            ->where('is_active', true)
            ->get();

        $customers = Customer::all();
        $user = User::first();

        if ($products->isEmpty() || !$user) {
            $this->command->warn('StockOutSeeder dilewati: master data belum tersedia.');
            return;
        }

        DB::transaction(function () use ($products, $customers, $user) {
            for ($i = 1; $i <= 8; $i++) {
                $items = $products->random(min(3, $products->count()));

                $stockOut = StockOut::firstOrCreate(
                    ['reference_number' => 'SO-SEED-002'],
                    [
                        'transaction_date' => now(),
                        'total_quantity' => 0,
                        'total_amount' => 0,
                        'status' => 'POSTED',
                        'notes' => 'Data pengeluaran barang dummy',
                        'created_by' => 1,
                    ]
                );

                $totalQty = 0;
                $totalAmount = 0;

                foreach ($items as $product) {
                    $qty = rand(1, 3);
                    $price = (float) $product->selling_price;
                    $subtotal = $qty * $price;

                    StockOutItem::create([
                        'stock_out_id' => $stockOut->id,
                        'product_id' => $product->id,
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'subtotal' => $subtotal,
                    ]);

                    $totalQty += $qty;
                    $totalAmount += $subtotal;
                }

                $stockOut->update([
                    'total_quantity' => $totalQty,
                    'total_amount' => $totalAmount,
                ]);
            }
        });

        $this->command->info('StockOutSeeder berhasil.');
    }
}
