<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Models\StockMovement;
use App\Services\Inventory\StockFlowForecastService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // PERIOD FILTER

        $period = $request->input('period', '7days');

        $allowedPeriods = [
            'today',
            '7days',
            '30days',
            'this_month',
            'this_year',
            'custom',
        ];

        if (!in_array($period, $allowedPeriods, true)) {
            $period = '7days';
        }

        switch ($period) {
            case 'today':
                $startDate = now()->startOfDay();
                $endDate = now()->endOfDay();
                break;

            case '30days':
                $startDate = now()->subDays(29)->startOfDay();
                $endDate = now()->endOfDay();
                break;

            case 'this_month':
                $startDate = now()->startOfMonth();
                $endDate = now()->endOfDay();
                break;

            case 'this_year':
                $startDate = now()->startOfYear();
                $endDate = now()->endOfDay();
                break;

            case 'custom':
                $validated = $request->validate([
                    'date_from' => ['required', 'date'],
                    'date_to' => [
                        'required',
                        'date',
                        'after_or_equal:date_from',
                    ],
                ]);

                $startDate = Carbon::parse(
                    $validated['date_from']
                )->startOfDay();

                $endDate = Carbon::parse(
                    $validated['date_to']
                )->endOfDay();

                if ($startDate->diffInDays($endDate) > 365) {
                    abort(
                        422,
                        'Rentang tanggal maksimal 1 tahun.'
                    );
                }

                break;

            default:
                $startDate = now()->subDays(6)->startOfDay();
                $endDate = now()->endOfDay();
                break;
        }

        // PREVIOUS PERIOD

        [$previousStartDate, $previousEndDate] =
            $this->getPreviousPeriod(
                $period,
                $startDate,
                $endDate
            );

        // KPI COMPARISON

        $currentKpi = $this->getKpiData(
            $startDate,
            $endDate
        );

        $previousKpi = $this->getKpiData(
            $previousStartDate,
            $previousEndDate
        );

        $kpiComparison = [];

        foreach ($currentKpi as $key => $currentValue) {
            $previousValue = $previousKpi[$key];

            $changeValue = $currentValue - $previousValue;

            if ($previousValue != 0) {
                $change = round(
                    ($changeValue / abs($previousValue)) * 100,
                    2
                );
            } elseif ($currentValue != 0) {
                $change = 100;
            } else {
                $change = 0;
            }

            $trend = match (true) {
                $changeValue > 0 => 'up',
                $changeValue < 0 => 'down',
                default => 'neutral',
            };

            $kpiComparison[$key] = [
                'current' => $currentValue,
                'previous' => $previousValue,
                'change_value' => $changeValue,
                'change' => $change,
                'trend' => $trend,
            ];
        }

        // PRODUCT STATISTICS

        $total = Product::count();

        $outOfStock = Product::where('stock', '<=', 0)
            ->count();

        $lowStock = Product::where('stock', '>', 0)
            ->whereColumn('stock', '<=', 'minimum_stock')
            ->count();

        $inStock = max(
            $total - $outOfStock - $lowStock,
            0
        );

        $percent = fn(int $number) => $total > 0
            ? round(($number / $total) * 100)
            : 0;

        // INVENTORY VALUE

        $stockValue = (float) Product::sum(
            DB::raw('stock * purchase_price')
        );

        $potentialSellingValue = (float) Product::sum(
            DB::raw('stock * selling_price')
        );

        // CHART BUCKETS

        if ($period === 'today') {
            $buckets = collect(range(0, 23))
                ->map(fn($hour) => [
                    'key' => $hour,
                    'label' => sprintf('%02d:00', $hour),
                ]);

            $groupExpression = 'HOUR(created_at)';
        } elseif ($period === 'this_year') {
            $buckets = collect(range(1, 12))
                ->map(fn($month) => [
                    'key' => $month,
                    'label' => Carbon::create()
                        ->month($month)
                        ->format('M'),
                ]);

            $groupExpression = 'MONTH(created_at)';
        } else {
            $dateRange = collect();

            $current = $startDate->copy()->startOfDay();

            while ($current->lte($endDate)) {
                $dateRange->push($current->copy());

                $current->addDay();
            }

            $buckets = $dateRange->map(fn($day) => [
                'key' => $day->format('Y-m-d'),
                'label' => $day->format('D'),
            ]);

            $groupExpression = 'DATE(created_at)';
        }

        // NEW PRODUCTS CHART

        $productCounts = Product::query()
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->selectRaw(
                "{$groupExpression} as bucket, COUNT(*) as total"
            )
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        $productChart = $buckets
            ->map(function ($bucket) use ($productCounts) {
                return [
                    'day' => $bucket['label'],
                    'label' => $bucket['label'],
                    'value' => (int) (
                        $productCounts[$bucket['key']] ?? 0
                    ),
                ];
            })
            ->values();

        // STOCK MOVEMENT CHART

        $movementCounts = StockMovement::query()
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->selectRaw("
                {$groupExpression} as bucket,

                SUM(
                    CASE
                        WHEN movement_type IN ('IN', 'RETURN')
                        THEN quantity
                        ELSE 0
                    END
                ) as stock_in,

                SUM(
                    CASE
                        WHEN movement_type IN ('OUT', 'DAMAGE')
                        THEN ABS(quantity)
                        ELSE 0
                    END
                ) as stock_out,

                SUM(
                    CASE
                        WHEN movement_type = 'ADJUSTMENT'
                            AND quantity > 0
                        THEN quantity
                        ELSE 0
                    END
                ) as adjustment_in,

                SUM(
                    CASE
                        WHEN movement_type = 'ADJUSTMENT'
                            AND quantity < 0
                        THEN ABS(quantity)
                        ELSE 0
                    END
                ) as adjustment_out
            ")
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $movementChart = $buckets
            ->map(function ($bucket) use ($movementCounts) {
                $movement = $movementCounts->get(
                    $bucket['key']
                );

                return [
                    'day' => $bucket['label'],
                    'label' => $bucket['label'],

                    'date' => is_string($bucket['key'])
                        ? $bucket['key']
                        : null,

                    'in' => (float) (
                        $movement->stock_in ?? 0
                    ),

                    'out' => (float) (
                        $movement->stock_out ?? 0
                    ),

                    'adjustment_in' => (float) (
                        $movement->adjustment_in ?? 0
                    ),

                    'adjustment_out' => (float) (
                        $movement->adjustment_out ?? 0
                    ),
                ];
            })
            ->values();

        // CATEGORY INVENTORY ANALYTICS

        $categoryInventory = DB::table('categories')
            ->leftJoin(
                'products',
                'products.category_id',
                '=',
                'categories.id'
            )
            ->where('categories.is_active', true)
            ->select(
                'categories.id',
                'categories.name'
            )
            ->selectRaw(
                'COUNT(products.id) as products_count'
            )
            ->selectRaw(
                'COALESCE(SUM(products.stock), 0) as total_stock'
            )
            ->selectRaw(
                'COALESCE(
                    SUM(products.stock * products.purchase_price),
                    0
                ) as inventory_value'
            )
            ->groupBy(
                'categories.id',
                'categories.name'
            )
            ->orderByDesc('inventory_value')
            ->get()
            ->map(fn($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'products_count' => (int) $category->products_count,
                'total_stock' => (float) $category->total_stock,
                'inventory_value' => (float) $category->inventory_value,
            ])
            ->values();

        // TOP PRODUCTS

        $topProducts = Product::query()
            ->with([
                'category:id,name',
                'unit:id,symbol',
            ])
            ->where('stock', '>', 0)
            ->orderByDesc('stock')
            ->limit(10)
            ->get()
            ->map(fn(Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category?->name ?? '-',
                'unit' => $product->unit?->symbol,
                'stock' => (float) $product->stock,
                'inventory_value' => (float) (
                    $product->stock * $product->purchase_price
                ),
            ])
            ->values();

        // CRITICAL STOCK PRODUCTS

        $criticalProducts = Product::query()
            ->with([
                'category:id,name',
                'unit:id,symbol',
            ])
            ->whereColumn('stock', '<=', 'minimum_stock')
            ->orderBy('stock')
            ->limit(10)
            ->get()
            ->map(fn(Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category?->name ?? '-',
                'unit' => $product->unit?->symbol,
                'stock' => (float) $product->stock,
                'minimum_stock' => (float) $product->minimum_stock,

                'status' => $product->stock <= 0
                    ? 'Out of Stock'
                    : 'Low Stock',
            ])
            ->values();

        // RECENT PRODUCTS

        $recentProducts = Product::query()
            ->with([
                'category:id,name',
                'unit:id,symbol',
            ])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn(Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category?->name ?? '-',
                'unit' => $product->unit?->symbol,
                'stock' => (float) $product->stock,
                'price' => (float) $product->selling_price,

                'status' => $product->stock <= 0
                    ? 'Out of Stock'
                    : (
                        $product->stock <= $product->minimum_stock
                        ? 'Low Stock'
                        : 'In Stock'
                    ),
            ])
            ->values();

        // RECENT STOCK MOVEMENTS

        $recentMovements = StockMovement::query()
            ->with([
                'product:id,name,sku',
                'user:id,name',
            ])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn(StockMovement $movement) => [
                'id' => $movement->id,
                'reference_number' => $movement->reference_number,
                'movement_type' => $movement->movement_type,
                'quantity' => (float) $movement->quantity,
                'notes' => $movement->notes,

                'created_at' => $movement->created_at
                    ?->format('d M Y H:i'),

                'product' => [
                    'name' => $movement->product?->name ?? '-',
                    'sku' => $movement->product?->sku ?? '-',
                ],

                'user' => $movement->user?->name ?? '-',
            ])
            ->values();

        // STOCK FLOW FORECAST

        $stockFlowForecast = app(
            StockFlowForecastService::class
        )->calculate();

        // DASHBOARD RESPONSE

        return Inertia::render('dashboard/index', [

            // PERIOD FILTER
            'periodFilter' => [
                'period' => $period,

                'date_from' => $period === 'custom'
                    ? $startDate->format('Y-m-d')
                    : null,

                'date_to' => $period === 'custom'
                    ? $endDate->format('Y-m-d')
                    : null,
            ],

            // KPI COMPARISON
            'kpiComparison' => $kpiComparison,

            // STATISTICS
            'stats' => [
                'total_products' => $total,

                'active_products' => Product::where(
                    'is_active',
                    true
                )->count(),

                'stock_value' => $stockValue,

                'potential_selling_value' => $potentialSellingValue,

                'low_stock' => $lowStock + $outOfStock,

                'out_of_stock' => $outOfStock,

                'low_stock_products' => $lowStock,
            ],

            // INVENTORY SUMMARY
            'inventorySummary' => [
                [
                    'name' => 'In Stock',
                    'value' => $percent($inStock),
                    'color' => 'bg-emerald-500',
                ],
                [
                    'name' => 'Low Stock',
                    'value' => $percent($lowStock),
                    'color' => 'bg-amber-500',
                ],
                [
                    'name' => 'Out of Stock',
                    'value' => $percent($outOfStock),
                    'color' => 'bg-red-500',
                ],
            ],

            // CHARTS
            'chart' => $productChart,
            'movementChart' => $movementChart,

            // ANALYTICS
            'categoryInventory' => $categoryInventory,
            'topProducts' => $topProducts,
            'criticalProducts' => $criticalProducts,

            // RECENT DATA
            'recentProducts' => $recentProducts,
            'recentMovements' => $recentMovements,
            'stockFlowForecast' => $stockFlowForecast,
            // MASTER DATA
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                ]),

            'units' => Unit::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'symbol',
                ]),
        ]);
    }

    // PREVIOUS PERIOD CALCULATION

    private function getPreviousPeriod(
        string $period,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        switch ($period) {
            case 'today':
                $previousStart = now()
                    ->subDay()
                    ->startOfDay();

                $previousEnd = now()
                    ->subDay()
                    ->endOfDay();

                break;

            case '7days':
                $previousStart = $startDate
                    ->copy()
                    ->subDays(7);

                $previousEnd = $startDate
                    ->copy()
                    ->subSecond();

                break;

            case '30days':
                $previousStart = $startDate
                    ->copy()
                    ->subDays(30);

                $previousEnd = $startDate
                    ->copy()
                    ->subSecond();

                break;

            case 'this_month':
                $previousStart = now()
                    ->subMonthNoOverflow()
                    ->startOfMonth();

                // Month-to-date comparison
                $previousEnd = now()
                    ->subMonthNoOverflow()
                    ->endOfDay();

                break;

            case 'this_year':
                $previousStart = now()
                    ->subYear()
                    ->startOfYear();

                // Year-to-date comparison
                $previousEnd = now()
                    ->subYear()
                    ->endOfDay();

                break;

            case 'custom':
                $duration = $startDate
                    ->diffInDays($endDate) + 1;

                $previousEnd = $startDate
                    ->copy()
                    ->subSecond();

                $previousStart = $startDate
                    ->copy()
                    ->subDays($duration)
                    ->startOfDay();

                break;

            default:
                // 7 DAYS
                $previousStart = $startDate
                    ->copy()
                    ->subDays(7);

                $previousEnd = $startDate
                    ->copy()
                    ->subSecond();

                break;
        }

        return [
            $previousStart,
            $previousEnd,
        ];
    }

    // KPI DATA

    private function getKpiData(
        Carbon $startDate,
        Carbon $endDate
    ): array {
        // NEW PRODUCTS
        $newProducts = Product::query()
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->count();

        // STOCK IN
        $stockIn = StockMovement::query()
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->whereIn('movement_type', [
                'IN',
                'RETURN',
            ])
            ->sum('quantity');

        // STOCK OUT
        $stockOut = StockMovement::query()
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->whereIn('movement_type', [
                'OUT',
                'DAMAGE',
            ])
            ->selectRaw('COALESCE(SUM(ABS(quantity)), 0) as total')
            ->value('total');

        // STOCK ADJUSTMENT NET
        $adjustmentIn = StockMovement::query()
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->where('movement_type', 'ADJUSTMENT')
            ->where('quantity', '>', 0)
            ->sum('quantity');

        $adjustmentOut = StockMovement::query()
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->where('movement_type', 'ADJUSTMENT')
            ->where('quantity', '<', 0)
            ->selectRaw('COALESCE(SUM(ABS(quantity)), 0) as total')
            ->value('total');

        $adjustmentNet = $adjustmentIn - $adjustmentOut;

        // TOTAL MOVEMENT TRANSACTIONS
        $stockMovements = StockMovement::query()
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->count();

        return [
            'new_products' => (int) $newProducts,

            'stock_in' => (float) $stockIn,

            'stock_out' => (float) $stockOut,

            'stock_adjustments' => (float) $adjustmentNet,

            'stock_movements' => (int) $stockMovements,
        ];
    }
}
