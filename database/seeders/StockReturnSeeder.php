<?php

namespace Database\Seeders;

use App\Models\StockOut;
use App\Models\StockOutItem;
use App\Models\StockReturn;
use App\Models\StockReturnItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StockReturnSeeder extends Seeder
{
    public function run(): void
    {
        if (StockReturn::exists()) {
            $this->command->info('StockReturnSeeder dilewati: data sudah ada.');
            return;
        }

        $stockOuts = StockOut::query()
            ->where('status', 'POSTED')
            ->with('items.product')
            ->get();

        $user = User::first();

        if ($stockOuts->isEmpty() || !$user) {
            $this->command->warn('StockReturnSeeder dilewati: Stock Out belum tersedia.');
            return;
        }

        DB::transaction(function () use ($stockOuts, $user) {
            $returnNumber = 1;

            foreach ($stockOuts->take(3) as $stockOut) {
                $stockOutItem = $stockOut->items->first();

                if (!$stockOutItem) {
                    continue;
                }

                $originalQty = (float) $stockOutItem->quantity;

                if ($originalQty <= 0) {
                    continue;
                }

                // Ambil maksimal 1 unit, atau seluruhnya jika kurang dari 1.
                $returnQty = min(1, $originalQty);
                $restockQty = $returnQty;
                $damagedQty = 0;

                $reference = 'RT-SEED-' . str_pad(
                    $returnNumber,
                    3,
                    '0',
                    STR_PAD_LEFT
                );

                $unitPrice = (float) $stockOutItem->unit_price;
                $subtotal = $returnQty * $unitPrice;

                $stockReturn = StockReturn::create([
                    'reference_number' => $reference,
                    'stock_out_id' => $stockOut->id,
                    'return_date' => now()->subDays($returnNumber),
                    'total_quantity' => $returnQty,
                    'total_amount' => $subtotal,
                    'status' => 'POSTED',
                    'reason' => 'Sample data retur barang',
                    'created_by' => $user->id,
                ]);

                StockReturnItem::create([
                    'stock_return_id' => $stockReturn->id,
                    'stock_out_item_id' => $stockOutItem->id,
                    'product_id' => $stockOutItem->product_id,
                    'quantity' => $returnQty,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                    'restock_quantity' => $restockQty,
                    'damaged_quantity' => $damagedQty,
                    'notes' => 'Barang layak jual',
                ]);

                // Barang yang layak jual masuk kembali ke stok.
                $product = $stockOutItem->product;

                if ($product && $restockQty > 0) {
                    $product->stock = (float) $product->stock + $restockQty;
                    $product->save();

                    StockMovement::create([
                        'product_id' => $product->id,
                        'supplier_id' => null,
                        'user_id' => $user->id,
                        'movement_type' => 'RETURN',
                        'quantity' => $restockQty,
                        'reference_number' => $reference,
                        'notes' => 'Seeder stock return',
                    ]);
                }

                $returnNumber++;
            }
        });

        $this->command->info('StockReturnSeeder berhasil.');
    }
}
