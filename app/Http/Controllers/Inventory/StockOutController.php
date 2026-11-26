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
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'in:10,25,50,100'],
        ]);

        $query = StockOut::query()
            ->with([
                'creator:id,name',
                'items.product:id,sku,name,unit_id',
                'items.product.unit:id,name,symbol',
            ]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('items.product', function ($productQuery) use ($search) {
                        $productQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('transaction_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('transaction_date', '<=', $filters['end_date']);
        }

        $perPage = $filters['per_page'] ?? 10;

        $stockOuts = $query
            ->latest('transaction_date')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        // Summary mengikuti filter tanggal dan pencarian.
        $summaryQuery = StockOut::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $summaryQuery->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('items.product', function ($productQuery) use ($search) {
                        $productQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($filters['start_date'])) {
            $summaryQuery->whereDate(
                'transaction_date',
                '>=',
                $filters['start_date']
            );
        }

        if (!empty($filters['end_date'])) {
            $summaryQuery->whereDate(
                'transaction_date',
                '<=',
                $filters['end_date']
            );
        }

        $summary = [
            'total_transactions' => (clone $summaryQuery)->count(),

            'total_quantity' => (clone $summaryQuery)
                ->sum('total_quantity'),

            'total_amount' => (clone $summaryQuery)
                ->sum('total_amount'),

            'today_transactions' => StockOut::query()
                ->whereDate('transaction_date', today())
                ->count(),
        ];

        return Inertia::render('inventory/stock-out/index', [
            'stockOuts' => $stockOuts,
            'summary' => $summary,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'start_date' => $filters['start_date'] ?? '',
                'end_date' => $filters['end_date'] ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

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

    public function show(string $reference)
    {
        $stockOut = StockOut::query()
            ->with([
                'creator:id,name',
                'items.product:id,sku,name,unit_id',
                'items.product.unit:id,name,symbol',
            ])
            ->where('reference_number', $reference)
            ->firstOrFail();

        $movements = StockMovement::query()
            ->with([
                'product:id,sku,name,unit_id',
                'product.unit:id,name,symbol',
                'user:id,name',
            ])
            ->where('reference_number', $reference)
            ->orderBy('id')
            ->get();

        return Inertia::render('inventory/stock-out/show', [
            'stockOut' => $stockOut,
            'movements' => $movements,
        ]);
    }
}
