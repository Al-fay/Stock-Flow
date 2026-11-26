<?php

namespace App\Http\Controllers\Inventory;

use App\Exports\Inventory\InventoryReportsExport;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class InventoryReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer'],
            'product_id' => ['nullable', 'integer'],
            'movement_type' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'in:10,25,50,100'],
        ]);

        $perPage = $filters['per_page'] ?? 10;

        $productQuery = Product::query()
            ->with(['category', 'unit'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($filters['category_id'] ?? null, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($filters['product_id'] ?? null, function ($query, $productId) {
                $query->where('id', $productId);
            });

        $products = $productQuery
            ->orderBy('name')
            ->paginate(
                $perPage,
                ['*'],
                'products_page'
            )
            ->withQueryString();

        $valuationQuery = Product::query()
            ->when($filters['category_id'] ?? null, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($filters['product_id'] ?? null, function ($query, $productId) {
                $query->where('id', $productId);
            })
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            });

        $valuation = $valuationQuery
            ->selectRaw('
                COALESCE(SUM(stock), 0) as total_stock,
                COALESCE(SUM(stock * purchase_price), 0) as total_inventory_value,
                COALESCE(SUM(stock * selling_price), 0) as total_selling_value,
                COUNT(*) as total_products
            ')
            ->first();


        $movementQuery = StockMovement::query()
            ->with(['product.category', 'product.unit', 'user'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('reference_number', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('product', function ($productQuery) use ($search) {
                            $productQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('sku', 'like', "%{$search}%");
                        });
                });
            })
            ->when($filters['category_id'] ?? null, function ($query, $categoryId) {
                $query->whereHas('product', function ($productQuery) use ($categoryId) {
                    $productQuery->where('category_id', $categoryId);
                });
            })
            ->when($filters['product_id'] ?? null, function ($query, $productId) {
                $query->where('product_id', $productId);
            })
            ->when($filters['movement_type'] ?? null, function ($query, $type) {
                $query->where('movement_type', $type);
            })
            ->when($filters['date_from'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', '>=', $date);
            })
            ->when($filters['date_to'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', '<=', $date);
            });

        $movementSummary = (clone $movementQuery)
            ->selectRaw("
                COUNT(*) as total_transactions,
                COALESCE(SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END), 0) as total_in,
                COALESCE(SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END), 0) as total_out
            ")
            ->first();

        $movements = $movementQuery
            ->latest()
            ->paginate(
                $perPage,
                ['*'],
                'movements_page'
            )
            ->withQueryString();

        $categories = DB::table('categories')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $productOptions = Product::query()
            ->select('id', 'name', 'sku')
            ->orderBy('name')
            ->get();

        return Inertia::render('inventory/reports/index', [
            'products' => $products,
            'movements' => $movements,

            'valuation' => $valuation,
            'movementSummary' => $movementSummary,

            'categories' => $categories,
            'productOptions' => $productOptions,

            'filters' => $filters,
        ]);
    }

    public function export(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer'],
            'product_id' => ['nullable', 'integer'],
            'movement_type' => ['nullable', 'in:IN,OUT,RETURN,ADJUSTMENT,DAMAGE'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $filename = 'inventory-reports-' . now()->format('Y-m-d_H-i-s') . '.xlsx';

        return Excel::download(
            new InventoryReportsExport($filters),
            $filename
        );
    }

    public function exportPdf(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer'],
            'product_id' => ['nullable', 'integer'],
            'movement_type' => [
                'nullable',
                'in:IN,OUT,RETURN,ADJUSTMENT,DAMAGE',
            ],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $productQuery = Product::query()
            ->with(['category', 'unit']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $productQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['category_id'])) {
            $productQuery->where(
                'category_id',
                $filters['category_id']
            );
        }

        if (!empty($filters['product_id'])) {
            $productQuery->where(
                'id',
                $filters['product_id']
            );
        }

        $products = $productQuery
            ->orderBy('name')
            ->get();

        $totalProducts = $products->count();

        $totalStock = $products->sum('stock');

        $totalInventoryValue = $products->sum(
            fn($product) => $product->stock * $product->purchase_price
        );

        $totalPotentialSellingValue = $products->sum(
            fn($product) => $product->stock * $product->selling_price
        );

        $movementQuery = StockMovement::query()
            ->with([
                'product.category',
                'product.unit',
                'user',
            ]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $movementQuery->where(function ($query) use ($search) {
                $query->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($productQuery) use ($search) {
                        $productQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($filters['category_id'])) {
            $movementQuery->whereHas('product', function ($query) use ($filters) {
                $query->where('category_id', $filters['category_id']);
            });
        }

        if (!empty($filters['product_id'])) {
            $movementQuery->where(
                'product_id',
                $filters['product_id']
            );
        }

        if (!empty($filters['movement_type'])) {
            $movementQuery->where(
                'movement_type',
                $filters['movement_type']
            );
        }

        if (!empty($filters['date_from'])) {
            $movementQuery->whereDate(
                'created_at',
                '>=',
                $filters['date_from']
            );
        }

        if (!empty($filters['date_to'])) {
            $movementQuery->whereDate(
                'created_at',
                '<=',
                $filters['date_to']
            );
        }

        $movements = $movementQuery
            ->latest()
            ->get();


        $totalMovementIn = $movements
            ->where('quantity', '>', 0)
            ->sum('quantity');

        $totalMovementOut = abs(
            $movements
                ->where('quantity', '<', 0)
                ->sum('quantity')
        );

        $netMovement = $movements->sum('quantity');


        $pdf = Pdf::loadView('reports.inventory.inventory-reports', [
            'products' => $products,
            'movements' => $movements,
            'filters' => $filters,

            'summary' => [
                'total_products' => $totalProducts,
                'total_stock' => $totalStock,
                'total_inventory_value' => $totalInventoryValue,
                'total_potential_selling_value' => $totalPotentialSellingValue,
            ],

            'movementSummary' => [
                'total_in' => $totalMovementIn,
                'total_out' => $totalMovementOut,
                'net_movement' => $netMovement,
            ],

            'generatedAt' => now(),
        ]);

        $pdf->setPaper('A4', 'landscape');

        return $pdf->download(
            'inventory-reports-' . now()->format('Y-m-d_H-i-s') . '.pdf'
        );
    }
}
