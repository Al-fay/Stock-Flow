<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\StockOut;
use App\Models\StockOutItem;
use App\Models\StockReturn;
use App\Models\StockReturnItem;
use App\Services\Audit\AuditLogService;
use App\Services\Notification\NotificationService;
use App\Services\Notification\StockAlertNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockReturnController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'per_page' => ['nullable', 'integer', 'in:10,25,50,100'],
        ]);

        $applyFilters = function ($query) use ($filters) {
            if (!empty($filters['search'])) {
                $search = trim($filters['search']);

                $query->where(function ($q) use ($search) {
                    $q->where('reference_number', 'like', "%{$search}%")
                        ->orWhere('reason', 'like', "%{$search}%")
                        ->orWhereHas('stockOut', function ($sq) use ($search) {
                            $sq->where(
                                'reference_number',
                                'like',
                                "%{$search}%"
                            );
                        })
                        ->orWhereHas('items.product', function ($pq) use ($search) {
                            $pq->where('name', 'like', "%{$search}%")
                                ->orWhere('sku', 'like', "%{$search}%");
                        });
                });
            }

            if (!empty($filters['start_date'])) {
                $query->whereDate(
                    'return_date',
                    '>=',
                    $filters['start_date']
                );
            }

            if (!empty($filters['end_date'])) {
                $query->whereDate(
                    'return_date',
                    '<=',
                    $filters['end_date']
                );
            }

            return $query;
        };

        $query = $applyFilters(
            StockReturn::query()
        );

        $returns = $query
            ->with([
                'creator:id,name',
                'stockOut:id,reference_number,transaction_date',
                'items.product:id,sku,name,unit_id',
                'items.product.unit:id,name,symbol',
            ])
            ->latest('return_date')
            ->latest('id')
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();

        $summaryQuery = $applyFilters(
            StockReturn::query()
        );

        $totalTransactions = (clone $summaryQuery)->count();

        $totalQuantity = (clone $summaryQuery)
            ->sum('total_quantity');

        $totalAmount = (clone $summaryQuery)
            ->sum('total_amount');

        $returnItemQuery = StockReturnItem::query()
            ->whereHas('stockReturn', function ($query) use ($applyFilters) {
                $applyFilters($query);
            });

        $totalRestock = (clone $returnItemQuery)
            ->sum('restock_quantity');

        $totalDamaged = (clone $returnItemQuery)
            ->sum('damaged_quantity');

        return Inertia::render('inventory/stock-return/index', [
            'returns' => $returns,

            'summary' => [
                'total_transactions' => $totalTransactions,
                'total_quantity' => $totalQuantity,
                'total_restock' => $totalRestock,
                'total_damaged' => $totalDamaged,
                'total_amount' => $totalAmount,
            ],

            'filters' => [
                'search' => $filters['search'] ?? '',
                'start_date' => $filters['start_date'] ?? '',
                'end_date' => $filters['end_date'] ?? '',
                'per_page' => $filters['per_page'] ?? 10,
            ],
        ]);
    }

    public function create(Request $request)
    {
        $stockOuts = StockOut::query()
            ->where('status', 'POSTED')
            ->with([
                'creator:id,name',
                'items.product:id,sku,name,unit_id',
                'items.product.unit:id,name,symbol',
            ])
            ->latest('transaction_date')
            ->get();

        $returnedQuantities = StockReturnItem::query()
            ->select(
                'stock_out_item_id',
                DB::raw('SUM(quantity) as returned_quantity')
            )
            ->whereHas('stockReturn', function ($query) {
                $query->where('status', 'POSTED');
            })
            ->groupBy('stock_out_item_id')
            ->pluck('returned_quantity', 'stock_out_item_id');

        $stockOuts = $stockOuts->map(function ($stockOut) use ($returnedQuantities) {
            $stockOut->items = $stockOut->items->map(function ($item) use ($returnedQuantities) {
                $returnedQuantity = (float) (
                    $returnedQuantities[$item->id] ?? 0
                );

                $originalQuantity = (float) $item->quantity;

                $remainingQuantity = max(
                    0,
                    round($originalQuantity - $returnedQuantity, 3)
                );

                $item->returned_quantity = $returnedQuantity;
                $item->remaining_quantity = $remainingQuantity;

                return $item;
            });

            $stockOut->returnable = $stockOut->items->contains(
                fn($item) => $item->remaining_quantity > 0
            );

            return $stockOut;
        })
            ->filter(fn($stockOut) => $stockOut->returnable)
            ->values();

        return Inertia::render('inventory/stock-return/create', [
            'stockOuts' => $stockOuts,
        ]);
    }

    public function store(
        Request $request,
        NotificationService $notificationService,
        StockAlertNotificationService $stockAlertService,
        AuditLogService $auditLogService
    ) {
        $validated = $request->validate([
            'stock_out_id' => ['required', 'integer', 'exists:stock_outs,id'],
            'return_date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:2000'],

            'items' => ['required', 'array', 'min:1'],

            'items.*.stock_out_item_id' => [
                'required',
                'integer',
                'distinct',
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'decimal:0,3',
                'gt:0',
            ],

            'items.*.restock_quantity' => [
                'required',
                'numeric',
                'decimal:0,3',
                'gte:0',
            ],

            'items.*.notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $user = $request->user();
        $userId = $user?->id;

        /*
        |--------------------------------------------------------------------------
        | TRANSACTION
        |--------------------------------------------------------------------------
        | Seluruh proses retur, perubahan stok, Stock Movement,
        | dan Audit Log tetap berada dalam database transaction.
        |--------------------------------------------------------------------------
        */

        $return = DB::transaction(function () use (
            $validated,
            $userId,
            $auditLogService
        ) {
            // Lock header transaksi Stock Out.
            $stockOut = StockOut::query()
                ->whereKey($validated['stock_out_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($stockOut->status !== 'POSTED') {
                throw ValidationException::withMessages([
                    'stock_out_id' => 'Transaksi Stock Out belum posted.',
                ]);
            }

            $items = $validated['items'];

            $stockOutItemIds = collect($items)
                ->pluck('stock_out_item_id')
                ->map(fn($id) => (int) $id)
                ->sort()
                ->values();

            // Lock item Stock Out.
            $stockOutItems = StockOutItem::query()
                ->where('stock_out_id', $stockOut->id)
                ->whereIn('id', $stockOutItemIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($stockOutItems->count() !== $stockOutItemIds->count()) {
                throw ValidationException::withMessages([
                    'items' => 'Item Stock Out tidak valid.',
                ]);
            }

            $returnItems = [];

            $totalQuantityMilli = 0;
            $totalRestockMilli = 0;
            $totalAmountCents = 0;

            foreach ($items as $itemInput) {
                $stockOutItemId = (int) $itemInput['stock_out_item_id'];

                $stockOutItem = $stockOutItems->get($stockOutItemId);

                $quantityMilli = (int) round(
                    (float) $itemInput['quantity'] * 1000
                );

                $restockMilli = (int) round(
                    (float) $itemInput['restock_quantity'] * 1000
                );

                if ($restockMilli > $quantityMilli) {
                    throw ValidationException::withMessages([
                        'items' => 'Qty layak stok tidak boleh melebihi qty retur.',
                    ]);
                }

                // Total retur sebelumnya pada item ini.
                $previousReturnedMilli = (int) round(
                    StockReturnItem::query()
                        ->where('stock_out_item_id', $stockOutItemId)
                        ->whereHas(
                            'stockReturn',
                            fn($q) =>
                            $q->where('status', 'POSTED')
                        )
                        ->sum('quantity') * 1000
                );

                $originalQuantityMilli = (int) round(
                    (float) $stockOutItem->quantity * 1000
                );

                $remainingMilli = $originalQuantityMilli
                    - $previousReturnedMilli;

                if ($quantityMilli > $remainingMilli) {
                    throw ValidationException::withMessages([
                        'items' => sprintf(
                            'Quantity retur melebihi sisa retur produk %s. Maksimal: %s.',
                            $stockOutItem->product?->name ?? $stockOutItemId,
                            number_format($remainingMilli / 1000, 3, '.', '')
                        ),
                    ]);
                }

                $unitPriceCents = (int) round(
                    (float) $stockOutItem->unit_price * 100
                );

                $subtotalCents = (int) round(
                    $quantityMilli * $unitPriceCents / 1000
                );

                $returnItems[] = [
                    'stock_out_item_id' => $stockOutItemId,
                    'product_id' => $stockOutItem->product_id,
                    'quantity_milli' => $quantityMilli,
                    'restock_milli' => $restockMilli,
                    'damaged_milli' => $quantityMilli - $restockMilli,
                    'unit_price_cents' => $unitPriceCents,
                    'subtotal_cents' => $subtotalCents,
                    'notes' => $itemInput['notes'] ?? null,
                ];

                $totalQuantityMilli += $quantityMilli;
                $totalRestockMilli += $restockMilli;
                $totalAmountCents += $subtotalCents;
            }

            $reference = 'RT-' . now()->format('YmdHis')
                . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));

            $stockReturn = StockReturn::create([
                'reference_number' => $reference,
                'stock_out_id' => $stockOut->id,
                'return_date' => $validated['return_date'],
                'total_quantity' => $totalQuantityMilli / 1000,
                'total_amount' => $totalAmountCents / 100,
                'status' => 'POSTED',
                'reason' => $validated['reason'] ?? null,
                'created_by' => $userId,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Lock products dalam urutan ID agar konsisten.
            |--------------------------------------------------------------------------
            */

            $productIds = collect($returnItems)
                ->pluck('product_id')
                ->unique()
                ->sort()
                ->values();

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            /*
            |--------------------------------------------------------------------------
            | Audit Detail Items
            |--------------------------------------------------------------------------
            */

            $auditItems = [];

            foreach ($returnItems as $item) {
                $product = $products->get($item['product_id']);

                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => 'Produk retur tidak ditemukan.',
                    ]);
                }

                $currentStockMilli = (int) round(
                    (float) $product->stock * 1000
                );

                $restockMilli = $item['restock_milli'];

                $newStockMilli = $currentStockMilli + $restockMilli;

                /*
                 * Simpan detail Stock Return.
                 */
                $stockReturnItem = $stockReturn->items()->create([
                    'stock_out_item_id' => $item['stock_out_item_id'],
                    'product_id' => $item['product_id'],

                    'quantity' => number_format(
                        $item['quantity_milli'] / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'unit_price' => number_format(
                        $item['unit_price_cents'] / 100,
                        2,
                        '.',
                        ''
                    ),

                    'subtotal' => number_format(
                        $item['subtotal_cents'] / 100,
                        2,
                        '.',
                        ''
                    ),

                    'restock_quantity' => number_format(
                        $restockMilli / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'damaged_quantity' => number_format(
                        $item['damaged_milli'] / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'notes' => $item['notes'],
                ]);

                /*
                |--------------------------------------------------------------------------
                | Audit item.
                |--------------------------------------------------------------------------
                | Tetap mencatat stok sebelum/sesudah walaupun barang
                | retur sepenuhnya rusak dan tidak masuk stok.
                |--------------------------------------------------------------------------
                */

                $auditItems[] = [
                    'product_id' => $product->id,
                    'sku' => $product->sku,
                    'product_name' => $product->name,

                    'return_quantity' => number_format(
                        $item['quantity_milli'] / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'restock_quantity' => number_format(
                        $restockMilli / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'damaged_quantity' => number_format(
                        $item['damaged_milli'] / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'unit_price' => number_format(
                        $item['unit_price_cents'] / 100,
                        2,
                        '.',
                        ''
                    ),

                    'subtotal' => number_format(
                        $item['subtotal_cents'] / 100,
                        2,
                        '.',
                        ''
                    ),

                    'stock_before' => number_format(
                        $currentStockMilli / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'stock_after' => number_format(
                        $newStockMilli / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'notes' => $item['notes'],
                ];

                /*
                |--------------------------------------------------------------------------
                | Restock
                |--------------------------------------------------------------------------
                */

                if ($restockMilli <= 0) {
                    continue;
                }

                // Stock tidak dimasukkan ke fillable.
                $product->stock = number_format(
                    $newStockMilli / 1000,
                    3,
                    '.',
                    ''
                );

                $product->save();

                /*
                 * Ledger hanya untuk barang layak masuk stok.
                 */
                StockMovement::create([
                    'product_id' => $product->id,
                    'supplier_id' => null,
                    'user_id' => $userId,
                    'movement_type' => 'RETURN',

                    'quantity' => number_format(
                        $restockMilli / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'reference_number' => $reference,
                    'notes' => "Retur dari Stock Out {$stockOut->reference_number}",
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Audit Log: STOCK RETURN
            |--------------------------------------------------------------------------
            */

            $auditLogService->log(
                action: 'STOCK_RETURN',
                module: 'INVENTORY',
                description: "Stock Return {$reference} berhasil diposting",
                auditable: $stockReturn,
                newValues: [
                    'reference_number' => $reference,
                    'stock_out_reference' => $stockOut->reference_number,
                    'return_date' => $validated['return_date'],

                    'total_quantity' => number_format(
                        $totalQuantityMilli / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'total_restock' => number_format(
                        $totalRestockMilli / 1000,
                        3,
                        '.',
                        ''
                    ),

                    'total_damaged' => number_format(
                        ($totalQuantityMilli - $totalRestockMilli) / 1000,
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

                    'status' => 'POSTED',
                ],
                metadata: [
                    'items' => $auditItems,
                    'reason' => $validated['reason'] ?? null,
                ],
            );

            return $stockReturn;
        }, 3);

        /*
        |--------------------------------------------------------------------------
        | NOTIFICATION: STOCK RETURN COMPLETED
        |--------------------------------------------------------------------------
        | Dijalankan setelah transaksi berhasil commit.
        |--------------------------------------------------------------------------
        */

        try {
            $notificationService->stockReturn(
                $user,
                $return->reference_number,
                $return->id
            );
        } catch (\Throwable $e) {
            Log::error('Stock Return notification failed.', [
                'stock_return_id' => $return->id,
                'reference_number' => $return->reference_number,
                'error' => $e->getMessage(),
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | STOCK ALERT RE-EVALUATION
        |--------------------------------------------------------------------------
        | Evaluasi hanya produk yang terlibat dalam transaksi retur.
        |--------------------------------------------------------------------------
        */

        try {
            $productIds = StockReturnItem::query()
                ->where('stock_return_id', $return->id)
                ->pluck('product_id')
                ->unique();

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->get();

            foreach ($products as $product) {
                try {
                    $stockAlertService->evaluateProduct($product);
                } catch (\Throwable $e) {
                    Log::error('Stock Return alert evaluation failed.', [
                        'stock_return_id' => $return->id,
                        'product_id' => $product->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Stock Return alert evaluation process failed.', [
                'stock_return_id' => $return->id,
                'error' => $e->getMessage(),
            ]);
        }

        return redirect()
            ->route('inventory.stock-return.index')
            ->with(
                'success',
                "Retur {$return->reference_number} berhasil disimpan."
            );
    }

    public function show(string $reference)
    {
        $stockReturn = StockReturn::query()
            ->with([
                'creator',
                'stockOut',
                'items.product.unit',
            ])
            ->where('reference_number', $reference)
            ->firstOrFail();

        $movements = StockMovement::query()
            ->with(['product', 'user'])
            ->where('reference_number', $reference)
            ->where('movement_type', 'RETURN')
            ->latest()
            ->get();

        return Inertia::render('inventory/stock-return/show', [
            'stockReturn' => $stockReturn,
            'movements' => $movements,
        ]);
    }
}
