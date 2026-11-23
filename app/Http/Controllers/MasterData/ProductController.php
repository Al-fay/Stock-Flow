<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductController extends Controller
{
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

        Product::create($validated);

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

        $product->update($validated);

        return back()->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return back()->with('success', 'Produk berhasil dihapus.');
    }
}
