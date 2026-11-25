<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockOpnameController extends Controller
{

    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:DRAFT,POSTED'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = StockOpname::query()
            ->with('creator:id,name')
            ->withCount('items');

        if (!empty($validated['search'])) {
            $query->where('code', 'like', '%' . $validated['search'] . '%');
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $opnames = $query
            ->latest('created_at')
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return Inertia::render('inventory/opname/index', [
            'opnames' => $opnames,
            'filters' => [
                'search' => $validated['search'] ?? '',
                'status' => $validated['status'] ?? '',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'opname_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use ($request, $validated) {
            $code = 'OPN-' . now()->format('YmdHis') . '-' . strtoupper(
                \Illuminate\Support\Str::random(4)
            );

            $opname = StockOpname::create([
                'code' => $code,
                'opname_date' => $validated['opname_date'],
                'status' => 'DRAFT',
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $products = Product::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'stock']);

            foreach ($products as $product) {
                StockOpnameItem::create([
                    'stock_opname_id' => $opname->id,
                    'product_id' => $product->id,
                    'system_stock' => $product->stock,
                    'physical_stock' => $product->stock,
                    'difference' => 0,
                    'is_counted' => false,
                ]);
            }

            return $opname;
        });

        return redirect()
            ->route('inventory.opname.index')
            ->with('success', 'Stock opname berhasil dibuat.');
    }

    public function show(StockOpname $opname)
    {
        $opname->load([
            'creator:id,name',
            'poster:id,name',
            'items.product:id,sku,name,stock,minimum_stock,unit_id',
            'items.product.unit:id,name,symbol',
        ]);

        return Inertia::render('inventory/opname/show', [
            'opname' => $opname,
        ]);
    }

    public function update(Request $request, StockOpname $opname)
    {
        if ($opname->status !== 'DRAFT') {
            throw ValidationException::withMessages([
                'opname' => 'Stock opname yang sudah diposting tidak dapat diubah.',
            ]);
        }

        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => [
                'required',
                'integer',
                'distinct',
                'exists:stock_opname_items,id',
            ],
            'items.*.physical_stock' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,3',
            ],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
            'items.*.is_counted' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($opname, $validated) {
            $lockedOpname = StockOpname::query()
                ->lockForUpdate()
                ->findOrFail($opname->id);

            if ($lockedOpname->status !== 'DRAFT') {
                throw ValidationException::withMessages([
                    'opname' => 'Stock opname sudah diposting.',
                ]);
            }

            foreach ($validated['items'] as $data) {
                $item = StockOpnameItem::query()
                    ->where('stock_opname_id', $lockedOpname->id)
                    ->where('id', $data['id'])
                    ->firstOrFail();

                $physicalStock = (int) round(
                    (float) $data['physical_stock'] * 1000
                );

                $systemStock = (int) round(
                    (float) $item->system_stock * 1000
                );

                $difference = $physicalStock - $systemStock;

                $item->update([
                    'physical_stock' => number_format(
                        $physicalStock / 1000,
                        3,
                        '.',
                        ''
                    ),
                    'difference' => number_format(
                        $difference / 1000,
                        3,
                        '.',
                        ''
                    ),
                    'is_counted' => $data['is_counted'],
                    'notes' => $data['notes'] ?? null,
                ]);
            }
        });

        return back()->with('success', 'Data stok fisik berhasil disimpan.');
    }

    public function post(Request $request, StockOpname $opname)
    {
        return DB::transaction(function () use ($request, $opname) {
            $lockedOpname = StockOpname::query()
                ->whereKey($opname->id)
                ->lockForUpdate()
                ->with('items')
                ->firstOrFail();

            if ($lockedOpname->status !== 'DRAFT') {
                throw ValidationException::withMessages([
                    'opname' => 'Stock opname ini sudah diposting.',
                ]);
            }

            if ($lockedOpname->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'opname' => 'Stock opname tidak memiliki produk.',
                ]);
            }

            $uncountedItems = $lockedOpname->items
                ->where('is_counted', false);

            if ($uncountedItems->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'opname' => 'Masih terdapat produk yang belum dihitung.',
                ]);
            }

            foreach ($lockedOpname->items as $item) {
                $product = Product::query()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->first();

                if (!$product) {
                    throw ValidationException::withMessages([
                        'opname' => "Produk ID {$item->product_id} tidak ditemukan.",
                    ]);
                }

                $currentStock = (int) round(
                    (float) $product->stock * 1000
                );

                $physicalStock = (int) round(
                    (float) $item->physical_stock * 1000
                );

                $adjustment = $physicalStock - $currentStock;

                $product->update([
                    'stock' => $physicalStock / 1000,
                ]);

                if ($adjustment !== 0) {
                    StockMovement::create([
                        'product_id' => $product->id,
                        'supplier_id' => null,
                        'user_id' => $request->user()?->id,
                        'movement_type' => 'ADJUSTMENT',
                        'quantity' => $adjustment / 1000,
                        'reference_number' => $lockedOpname->code,
                        'notes' => $item->notes
                            ?: $lockedOpname->notes
                            ?: 'Adjustment Stock Opname',
                    ]);
                }

                $item->update([
                    'system_stock' => $currentStock / 1000,
                    'difference' => $adjustment / 1000,
                ]);
            }

            $lockedOpname->update([
                'status' => 'POSTED',
                'posted_by' => $request->user()?->id,
                'posted_at' => now(),
            ]);

            return redirect()
                ->route('inventory.opname.show', $lockedOpname->id)
                ->with('success', 'Stock opname berhasil diposting.');
        });
    }
}
