<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => [
                'nullable',
                Rule::in([
                    'sku',
                    'name',
                    'purchase_price',
                    'selling_price',
                    'stock',
                    'created_at',
                ]),
            ],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $search = $filters['search'] ?? '';
        $sort = $filters['sort'] ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';
        $perPage = $filters['per_page'] ?? 10;

        $products = Product::query()
            ->with([
                'category:id,name',
                'unit:id,name,symbol',
            ])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhereHas('category', function ($category) use ($search) {
                            $category->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('unit', function ($unit) use ($search) {
                            $unit->where('name', 'like', "%{$search}%")
                                ->orWhere('symbol', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('master-data/products/index', [
            'products' => $products,
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'units' => Unit::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'symbol']),
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('is_active', true)
                    ->whereNull('deleted_at'),
            ],
            'unit_id' => [
                'required',
                'integer',
                Rule::exists('units', 'id')
                    ->where('is_active', true)
                    ->whereNull('deleted_at'),
            ],
            'sku' => ['required', 'string', 'max:50', 'unique:products,sku'],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:products,barcode'],
            'name' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'minimum_stock' => ['required', 'numeric', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $product = Product::create($validated);

        $this->auditLogService->created(
            model: $product,
            module: 'PRODUCT',
            description: "Menambahkan produk {$product->name}",
            metadata: [
                'sku' => $product->sku,
            ],
        );

        return back()->with('success', 'Produk berhasil ditambahkan.');
    }


    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('is_active', true)
                    ->whereNull('deleted_at'),
            ],
            'unit_id' => [
                'required',
                'integer',
                Rule::exists('units', 'id')
                    ->where('is_active', true)
                    ->whereNull('deleted_at'),
            ],
            'sku' => [
                'required',
                'string',
                'max:50',
                Rule::unique('products', 'sku')->ignore($product->id),
            ],
            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products', 'barcode')->ignore($product->id),
            ],
            'name' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'minimum_stock' => ['required', 'numeric', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $fields = [
            'category_id',
            'unit_id',
            'sku',
            'barcode',
            'name',
            'description',
            'purchase_price',
            'selling_price',
            'minimum_stock',
            'is_active',
        ];

        $oldValues = $product->only($fields);

        $product->update($validated);

        $newValues = $product->fresh()->only($fields);

        $this->auditLogService->updated(
            model: $product,
            module: 'PRODUCT',
            description: "Mengubah produk {$product->name}",
            oldValues: $oldValues,
            newValues: $newValues,
            metadata: [
                'sku' => $product->sku,
            ],
        );

        return back()->with('success', 'Produk berhasil diperbarui.');
    }



    public function updateStatus(Request $request, Product $product)
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $oldStatus = $product->is_active;

        $product->update([
            'is_active' => $validated['is_active'],
        ]);

        $newStatus = $product->fresh()->is_active;

        $this->auditLogService->log(
            action: 'UPDATE',
            module: 'PRODUCT',
            description: $newStatus
                ? "Mengaktifkan produk {$product->name}"
                : "Menonaktifkan produk {$product->name}",
            auditable: $product,
            oldValues: [
                'is_active' => $oldStatus,
            ],
            newValues: [
                'is_active' => $newStatus,
            ],
            metadata: [
                'sku' => $product->sku,
                'change_type' => 'STATUS',
            ],
        );

        return back()->with('success', 'Status produk berhasil diperbarui.');
    }


    public function show(Request $request, Product $product)
    {
        $product->load([
            'category:id,name',
            'unit:id,name,symbol',
        ]);

        // Filter movement
        $movementQuery = $product->stockMovements()
            ->with([
                'user:id,name',
                'supplier:id,name',
            ])
            ->latest();

        // Filter berdasarkan tipe movement
        if ($request->filled('movement_type')) {
            $movementQuery->where(
                'movement_type',
                $request->movement_type
            );
        }

        // Filter tanggal mulai
        if ($request->filled('date_from')) {
            $movementQuery->whereDate(
                'created_at',
                '>=',
                $request->date_from
            );
        }

        // Filter tanggal akhir
        if ($request->filled('date_to')) {
            $movementQuery->whereDate(
                'created_at',
                '<=',
                $request->date_to
            );
        }

        // Riwayat movement
        $movements = $movementQuery
            ->paginate(10)
            ->withQueryString();

        // Summary semua movement produk
        $summary = [
            'total_in' => $product->stockMovements()
                ->where('movement_type', 'IN')
                ->sum('quantity'),

            'total_out' => $product->stockMovements()
                ->where('movement_type', 'OUT')
                ->sum('quantity'),

            'total_return' => $product->stockMovements()
                ->where('movement_type', 'RETURN')
                ->sum('quantity'),

            'total_adjustment' => $product->stockMovements()
                ->where('movement_type', 'ADJUSTMENT')
                ->sum('quantity'),

            'total_damage' => $product->stockMovements()
                ->where('movement_type', 'DAMAGE')
                ->sum('quantity'),

            'total_transactions' => $product->stockMovements()
                ->count(),
        ];

        return Inertia::render('master-data/products/show', [
            'product' => $product,

            'summary' => $summary,

            'movements' => $movements,

            'filters' => [
                'movement_type' => $request->movement_type,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
            ],
        ]);
    }

    public function destroy(Product $product)
    {
        $productData = $product->only([
            'id',
            'sku',
            'barcode',
            'name',
            'category_id',
            'unit_id',
            'purchase_price',
            'selling_price',
            'stock',
            'minimum_stock',
            'is_active',
        ]);

        $productName = $product->name;

        $this->auditLogService->log(
            action: 'DELETE',
            module: 'PRODUCT',
            description: "Menghapus produk {$productName}",
            auditable: $product,
            oldValues: $productData,
            metadata: [
                'sku' => $product->sku,
            ],
        );

        $product->delete();

        return back()->with('success', 'Produk berhasil dihapus.');
    }
}
