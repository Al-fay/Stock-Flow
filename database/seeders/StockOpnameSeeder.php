<?php

namespace Database\Seeders;

use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StockOpnameSeeder extends Seeder
{
    public function run(): void
    {
        if (StockOpname::exists()) {
            $this->command->info('StockOpnameSeeder dilewati: data sudah ada.');
            return;
        }

        $products = Product::query()
            ->where('is_active', true)
            ->get();

        $user = User::first();

        if ($products->isEmpty() || !$user) {
            $this->command->warn('StockOpnameSeeder dilewati: master data belum tersedia.');
            return;
        }

        DB::transaction(function () use ($products, $user) {
            for ($i = 1; $i <= 3; $i++) {
                $opname = StockOpname::create([
                    'code' => 'OPN-SEED-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'opname_date' => now()->subDays($i),
                    'status' => 'DRAFT',
                    'notes' => 'Stock opname dummy',
                    'created_by' => $user->id,
                ]);

                foreach ($products as $product) {
                    $systemStock = (float) $product->stock;

                    StockOpnameItem::create([
                        'stock_opname_id' => $opname->id,
                        'product_id' => $product->id,
                        'system_stock' => $systemStock,
                        'physical_stock' => $systemStock,
                        'difference' => 0,
                        'is_counted' => false,
                        'notes' => null,
                    ]);
                }
            }
        });

        $this->command->info('StockOpnameSeeder berhasil.');
    }
}
