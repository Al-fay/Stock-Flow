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
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'per_page' => ['nullable', 'integer', 'in:10,25,50,100'],
        ]);

        $search = $validated['search'] ?? '';
        $perPage = (int) ($validated['per_page'] ?? 10);

        $query = StockIn::query()
            ->with([
                'supplier:id,name',
                'creator:id,name',
            ])
            ->withCount('items');

        // Search
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                        $supplierQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Date filter
        if (!empty($validated['start_date'])) {
            $query->whereDate('transaction_date', '>=', $validated['start_date']);
        }

        if (!empty($validated['end_date'])) {
            $query->whereDate('transaction_date', '<=', $validated['end_date']);
        }

        // Summary menggunakan filter yang sama
        $summaryQuery = clone $query;

        $summary = [
            'total_transactions' => (clone $summaryQuery)->count(),

            'total_quantity' => (clone $summaryQuery)
                ->sum('total_quantity'),

            'total_amount' => (clone $summaryQuery)
                ->sum('total_amount'),

            'today_transactions' => (clone $summaryQuery)
                ->whereDate('transaction_date', today())
                ->count(),
        ];

        $stockIns = $query
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('inventory/stock-in/index', [
            'stockIns' => $stockIns,
            'summary' => $summary,
            'filters' => [
                'search' => $search,
                'start_date' => $validated['start_date'] ?? '',
                'end_date' => $validated['end_date'] ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

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

    public function show(string $reference)
    {
        $stockIn = StockIn::query()
            ->with([
                'supplier:id,name',
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

        return Inertia::render('inventory/stock-in/show', [
            'stockIn' => $stockIn,
            'movements' => $movements,
        ]);
    }
}
