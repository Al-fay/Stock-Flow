<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockIn;
use App\Models\StockInItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockInController extends Controller
{
    public function create()
    {
        return Inertia::render('inventory/stock-in/create', [
            'suppliers' => Supplier::query()
                ->orderBy('name')
                ->get(['id', 'name']),

            'products' => Product::query()
                ->where('is_active', true)
                ->with('unit:id,name,symbol')
                ->orderBy('name')
                ->get([
                    'id',
                    'sku',
                    'name',
                    'purchase_price',
                    'stock',
                    'unit_id',
                ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => [
                'required',
                'integer',
                'exists:suppliers,id',
            ],

            'transaction_date' => [
                'required',
                'date',
            ],

            'payment_method' => [
                'required',
                'in:CASH,TRANSFER,QRIS,OTHER',
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

            'items.*.unit_cost' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],
        ]);

        $stockIn = DB::transaction(function () use ($request, $validated) {
            $referenceNumber = 'SI-'
                . now()->format('YmdHis')
                . '-'
                . strtoupper(Str::random(4));

            $stockIn = StockIn::create([
                'reference_number' => $referenceNumber,
                'supplier_id' => $validated['supplier_id'],
                'transaction_date' => $validated['transaction_date'],
                'payment_method' => $validated['payment_method'],
                'status' => 'POSTED',
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
                'total_quantity' => 0,
                'total_amount' => 0,
            ]);

            $totalQuantityMilli = 0;
            $totalAmountCents = 0;

            // Sort product IDs to reduce deadlock risk.
            $productIds = collect($validated['items'])
                ->pluck('product_id')
                ->map(fn($id) => (int) $id)
                ->sort()
                ->values();

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($validated['items'] as $itemData) {
                $product = $products->get((int) $itemData['product_id']);

                if (!$product || !$product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => 'Produk tidak ditemukan atau sudah tidak aktif.',
                    ]);
                }

                $quantityMilli = (int) round(
                    (float) $itemData['quantity'] * 1000
                );

                $unitCostCents = (int) round(
                    (float) $itemData['unit_cost'] * 100
                );

                // Quantity (milli) x unit cost (cents)
                // converted to cents, rounded.
                $subtotalCents = (int) round(
                    ($quantityMilli * $unitCostCents) / 1000
                );

                $newStockMilli = (int) round(
                    (float) $product->stock * 1000
                ) + $quantityMilli;

                $product->update([
                    'stock' => number_format(
                        $newStockMilli / 1000,
                        3,
                        '.',
                        ''
                    ),
                ]);

                StockInItem::create([
                    'stock_in_id' => $stockIn->id,
                    'product_id' => $product->id,
                    'quantity' => number_format(
                        $quantityMilli / 1000,
                        3,
                        '.',
                        ''
                    ),
                    'unit_cost' => number_format(
                        $unitCostCents / 100,
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

                StockMovement::create([
                    'product_id' => $product->id,
                    'supplier_id' => $validated['supplier_id'],
                    'user_id' => $request->user()?->id,
                    'movement_type' => 'IN',
                    'quantity' => number_format(
                        $quantityMilli / 1000,
                        3,
                        '.',
                        ''
                    ),
                    'reference_number' => $referenceNumber,
                    'notes' => $validated['notes'] ?? 'Stock In',
                ]);

                $totalQuantityMilli += $quantityMilli;
                $totalAmountCents += $subtotalCents;
            }

            $stockIn->update([
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

            return $stockIn;
        }, 3);

        return redirect()
            ->route('inventory.stock-in.create')
            ->with('success', "Stock In {$stockIn->reference_number} berhasil disimpan.");
    }
}
