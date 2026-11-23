<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    /**
     * Menampilkan daftar pergerakan stok.
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'movement_type' => [
                'nullable',
                Rule::in(['IN', 'OUT', 'ADJUSTMENT', 'DAMAGE']),
            ],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'sort' => [
                'nullable',
                Rule::in([
                    'movement_type',
                    'quantity',
                    'reference_number',
                    'created_at',
                ]),
            ],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $search = $filters['search'] ?? '';
        $movementType = $filters['movement_type'] ?? null;
        $sort = $filters['sort'] ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';
        $perPage = $filters['per_page'] ?? 10;

        $movements = StockMovement::query()
            ->with([
                'product:id,sku,name,stock',
                'supplier:id,code,name',
                'user:id,name',
            ])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('reference_number', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('product', function ($product) use ($search) {
                            $product->where('sku', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('supplier', function ($supplier) use ($search) {
                            $supplier->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($movementType, function ($query) use ($movementType) {
                $query->where('movement_type', $movementType);
            })
            ->when($filters['date_from'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', '>=', $date);
            })
            ->when($filters['date_to'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', '<=', $date);
            })
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('inventory/index', [
            'movements' => $movements,

            'products' => Product::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'stock']),

            'suppliers' => Supplier::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name']),

            'filters' => [
                'search' => $search,
                'movement_type' => $movementType,
                'date_from' => $filters['date_from'] ?? '',
                'date_to' => $filters['date_to'] ?? '',
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Menyimpan transaksi dan memperbarui stok produk.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')
                    ->where('is_active', true)
                    ->whereNull('deleted_at'),
            ],

            'supplier_id' => [
                'nullable',
                'required_if:movement_type,IN',
                'integer',
                Rule::exists('suppliers', 'id')
                    ->where('is_active', true)
                    ->whereNull('deleted_at'),
            ],

            'movement_type' => [
                'required',
                Rule::in(['IN', 'OUT', 'ADJUSTMENT', 'DAMAGE']),
            ],

            // IN, OUT, DAMAGE menggunakan jumlah positif.
            // ADJUSTMENT menerima angka positif atau negatif.
            'quantity' => [
                'required',
                'numeric',
                'between:-999999999999999.999,999999999999999.999',
                'decimal:0,3',
                function ($attribute, $value, $fail) use ($request) {
                    $type = $request->input('movement_type');
                    $quantity = (float) $value;

                    if ($type === 'ADJUSTMENT' && $quantity == 0.0) {
                        $fail('Jumlah penyesuaian tidak boleh nol.');
                    }

                    if (
                        in_array($type, ['IN', 'OUT', 'DAMAGE'], true)
                        && $quantity <= 0
                    ) {
                        $fail('Jumlah transaksi harus lebih besar dari nol.');
                    }
                },
            ],

            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        // Supplier hanya digunakan untuk transaksi barang masuk.
        if ($validated['movement_type'] !== 'IN') {
            $validated['supplier_id'] = null;
        }

        DB::transaction(function () use ($request, $validated) {
            $product = Product::query()
                ->where('is_active', true)
                ->lockForUpdate()
                ->findOrFail($validated['product_id']);

            // Gunakan satuan ribuan agar perhitungan stok 3 desimal
            // tidak mengalami masalah pembulatan floating point.
            $currentStock = (int) round((float) $product->stock * 1000);
            $inputQuantity = (int) round((float) $validated['quantity'] * 1000);

            $movementType = $validated['movement_type'];

            $movementQuantity = match ($movementType) {
                'IN' => $inputQuantity,
                'OUT', 'DAMAGE' => -$inputQuantity,
                'ADJUSTMENT' => $inputQuantity,
            };

            $newStock = $currentStock + $movementQuantity;

            if ($newStock < 0) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stok tidak mencukupi untuk transaksi ini.',
                ]);
            }

            // Stok tidak diubah melalui mass assignment.
            $product->stock = number_format(
                $newStock / 1000,
                3,
                '.',
                '',
            );

            $product->save();

            StockMovement::create([
                'product_id' => $product->id,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'user_id' => $request->user()?->id,
                'movement_type' => $movementType,
                'quantity' => number_format(
                    $movementQuantity / 1000,
                    3,
                    '.',
                    '',
                ),
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return back()->with('success', 'Transaksi stok berhasil disimpan.');
    }
}