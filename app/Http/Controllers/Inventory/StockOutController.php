<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\StockOut;
use App\Models\StockOutItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockOutController extends Controller
{
    public function create()
    {
        return Inertia::render('inventory/stock-out/create', [
            'products' => Product::query()
                ->where('is_active', true)
                ->with('unit:id,name,symbol')
                ->orderBy('name')
                ->get([
                    'id',
                    'sku',
                    'name',
                    'selling_price',
                    'purchase_price',
                    'stock',
                    'unit_id',
                ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_date' => [
                'required',
                'date',
            ],

            'transaction_type' => [
                'required',
                'in:SALE,USAGE,DISTRIBUTION,OTHER',
            ],

            'destination' => [
                'nullable',
                'string',
                'max:150',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                'exists:products,id',
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,3',
            ],

            'items.*.unit_price' => [
                'nullable',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],
        ]);

        $stockOut = DB::transaction(function () use (
            $validated,
            $request
        ) {
            $items = $validated['items'];

            $productIds = collect($items)
                ->pluck('product_id')
                ->map(fn($id) => (int) $id)
                ->sort()
                ->values();

            /*
             * Lock product rows in consistent order.
             * Prevent concurrent transactions from causing
             * stock to become negative.
             */
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $reference = 'SO-' . now()->format('YmdHis')
                . '-' . strtoupper(substr(
                    str()->random(5),
                    0,
                    5
                ));

            $stockOut = StockOut::create([
                'reference_number' => $reference,
                'transaction_date' => $validated['transaction_date'],
                'transaction_type' => $validated['transaction_type'],
                'destination' => $validated['destination'] ?? null,
                'total_quantity' => 0,
                'total_amount' => 0,
                'status' => 'POSTED',
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $totalQuantityMilli = 0;
            $totalAmountCents = 0;

            foreach ($items as $item) {
                $productId = (int) $item['product_id'];

                $product = $products->get($productId);

                if (!$product || !$product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => 'Produk tidak ditemukan atau sudah tidak aktif.',
                    ]);
                }

                $quantityMilli = (int) round(
                    (float) $item['quantity'] * 1000
                );

                $currentStockMilli = (int) round(
                    (float) $product->stock * 1000
                );

                if ($quantityMilli <= 0) {
                    throw ValidationException::withMessages([
                        'items' => 'Quantity harus lebih dari 0.',
                    ]);
                }

                if ($quantityMilli > $currentStockMilli) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$product->name} tidak mencukupi. Stok tersedia: {$product->stock}.",
                    ]);
                }

                $unitPriceCents = (int) round(
                    (float) (
                        $item['unit_price']
                        ?? $product->selling_price
                    ) * 100
                );

                $subtotalCents = (int) round(
                    $quantityMilli * $unitPriceCents / 1000
                );

                $newStockMilli = $currentStockMilli - $quantityMilli;

                /*
                 * Direct assignment is intentional.
                 * Product.stock is not mass assignable.
                 */
                $product->stock = number_format(
                    $newStockMilli / 1000,
                    3,
                    '.',
                    ''
                );

                $product->save();

                StockOutItem::create([
                    'stock_out_id' => $stockOut->id,
                    'product_id' => $product->id,
                    'quantity' => number_format(
                        $quantityMilli / 1000,
                        3,
                        '.',
                        ''
                    ),
                    'unit_price' => number_format(
                        $unitPriceCents / 100,
                        2,
                        '.',
                        ''
                    ),
                    'subtotal' => number_format(
                        $subtotalCents / 100,
                        2,
                        '.',
                        ''
                    ),
                ]);

                /*
                 * StockMovement quantity is negative
                 * for OUT movements.
                 */
                StockMovement::create([
                    'product_id' => $product->id,
                    'supplier_id' => null,
                    'user_id' => $request->user()?->id,
                    'movement_type' => 'OUT',
                    'quantity' => number_format(
                        -$quantityMilli / 1000,
                        3,
                        '.',
                        ''
                    ),
                    'reference_number' => $reference,
                    'notes' => $validated['notes'] ?? null,
                ]);

                $totalQuantityMilli += $quantityMilli;
                $totalAmountCents += $subtotalCents;
            }

            $stockOut->update([
                'total_quantity' => number_format(
                    $totalQuantityMilli / 1000,
                    3,
                    '.',
                    ''
                ),
                'total_amount' => number_format(
                    $totalAmountCents / 100,
                    2,
                    '.',
                    ''
                ),
            ]);

            return $stockOut;
        }, 3);

        return redirect()
            ->route('inventory.stock-out.create')
            ->with(
                'success',
                "Stock Out {$stockOut->reference_number} berhasil disimpan."
            );
    }
}
