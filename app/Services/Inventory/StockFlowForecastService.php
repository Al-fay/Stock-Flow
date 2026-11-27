<?php

namespace App\Services\Inventory;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StockFlowForecastService
{
    /**
     * Analysis configuration.
     */
    private int $analysisDays = 30;

    /**
     * Target stock coverage.
     */
    private int $targetCoverageDays = 14;

    /**
     * Critical stock coverage.
     */
    private int $criticalDays = 3;

    /**
     * Low stock coverage.
     */
    private int $lowStockDays = 7;

    public function calculate(): array
    {
        $endDate = now()->endOfDay();

        $startDate = now()
            ->subDays($this->analysisDays - 1)
            ->startOfDay();

        // STOCK OUT AGGREGATION

        $movementSummary = DB::table('stock_movements')
            ->select('product_id')
            ->selectRaw(
                'COALESCE(SUM(ABS(quantity)), 0) as total_out'
            )
            ->where('movement_type', 'OUT')
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->groupBy('product_id');

        // PRODUCT FORECAST DATA

        $products = DB::table('products')
            ->leftJoinSub(
                $movementSummary,
                'movement_summary',
                function ($join) {
                    $join->on(
                        'movement_summary.product_id',
                        '=',
                        'products.id'
                    );
                }
            )
            ->leftJoin(
                'categories',
                'categories.id',
                '=',
                'products.category_id'
            )
            ->leftJoin(
                'units',
                'units.id',
                '=',
                'products.unit_id'
            )
            ->where('products.is_active', true)
            ->select([
                'products.id',
                'products.name',
                'products.sku',
                'products.stock',
                'products.minimum_stock',
                'products.created_at',

                'categories.name as category_name',
                'units.symbol as unit_symbol',
            ])
            ->selectRaw(
                'COALESCE(movement_summary.total_out, 0) as total_out'
            )
            ->get();

        // CALCULATE FORECAST

        $forecastProducts = $products->map(
            function ($product) use ($endDate) {

                $stock = (float) $product->stock;

                $minimumStock = (float) $product->minimum_stock;

                $totalOut = (float) $product->total_out;

                // ---------------------------------------------
                // ANALYSIS DAYS
                // ---------------------------------------------

                $createdAt = Carbon::parse(
                    $product->created_at
                )->startOfDay();

                $analysisStart = now()
                    ->subDays($this->analysisDays - 1)
                    ->startOfDay();

                // Avoid dividing newly created products
                // by a full 30 days if they are newer.
                $effectiveStart = $createdAt->greaterThan(
                    $analysisStart
                )
                    ? $createdAt
                    : $analysisStart;

                $daysObserved = max(
                    1,
                    $effectiveStart->diffInDays(
                        $endDate->copy()->startOfDay()
                    ) + 1
                );

                $daysObserved = min(
                    $daysObserved,
                    $this->analysisDays
                );

                // ---------------------------------------------
                // AVERAGE DAILY OUT
                // ---------------------------------------------

                $averageDailyOut = $totalOut / $daysObserved;

                // ---------------------------------------------
                // STOCK COVERAGE
                // ---------------------------------------------

                $coverageDays = $averageDailyOut > 0
                    ? max(0, $stock) / $averageDailyOut
                    : null;

                // ---------------------------------------------
                // TARGET STOCK
                // ---------------------------------------------

                $forecastTarget = $averageDailyOut
                    * $this->targetCoverageDays;

                $targetStock = max(
                    $minimumStock,
                    $forecastTarget
                );

                // ---------------------------------------------
                // RECOMMENDED RESTOCK QUANTITY
                // ---------------------------------------------

                $recommendedQuantity = max(
                    0,
                    $targetStock - $stock
                );

                // ---------------------------------------------
                // STOCK STATUS
                // ---------------------------------------------

                if ($stock <= 0) {

                    $status = 'out_of_stock';
                } elseif (
                    $averageDailyOut > 0
                    && $coverageDays <= $this->criticalDays
                ) {

                    $status = 'critical';
                } elseif (
                    $averageDailyOut > 0
                    && $coverageDays <= $this->lowStockDays
                ) {

                    $status = 'low';
                } elseif ($stock <= $minimumStock) {

                    $status = 'below_minimum';
                } else {

                    $status = 'healthy';
                }

                // ---------------------------------------------
                // RESTOCK PRIORITY
                // ---------------------------------------------

                $priority = match ($status) {
                    'out_of_stock' => 1,
                    'critical' => 2,
                    'low' => 3,
                    'below_minimum' => 4,
                    default => 5,
                };

                return [
                    'id' => $product->id,

                    'name' => $product->name,

                    'sku' => $product->sku,

                    'category' => $product->category_name ?? '-',

                    'unit' => $product->unit_symbol ?? '',

                    'stock' => round($stock, 3),

                    'minimum_stock' => round(
                        $minimumStock,
                        3
                    ),

                    'total_out' => round(
                        $totalOut,
                        3
                    ),

                    'average_daily_out' => round(
                        $averageDailyOut,
                        3
                    ),

                    'coverage_days' => $coverageDays !== null
                        ? round($coverageDays, 1)
                        : null,

                    'target_stock' => round(
                        $targetStock,
                        3
                    ),

                    'recommended_quantity' => round(
                        $recommendedQuantity,
                        3
                    ),

                    'status' => $status,

                    'priority' => $priority,
                ];
            }
        );

        // SORT PRODUCTS BY RESTOCK PRIORITY

        $sortedForecast = $forecastProducts
            ->sort(function ($a, $b) {

                if ($a['priority'] !== $b['priority']) {
                    return $a['priority'] <=> $b['priority'];
                }

                $coverageA = $a['coverage_days'] ?? -1;

                $coverageB = $b['coverage_days'] ?? -1;

                return $coverageA <=> $coverageB;
            })
            ->values();

        // RESTOCK RECOMMENDATIONS

        $restockRecommendations = $sortedForecast
            ->filter(
                fn($product) =>
                $product['recommended_quantity'] > 0
            )
            ->take(10)
            ->values();

        // FAST MOVING PRODUCTS

        $fastMovingProducts = $forecastProducts
            ->filter(
                fn($product) =>
                $product['total_out'] > 0
            )
            ->sortByDesc('total_out')
            ->take(10)
            ->values();

        // FORECAST SUMMARY

        $totalRecommendedQuantity = $forecastProducts
            ->filter(fn($product) => $product['recommended_quantity'] > 0)
            ->sum('recommended_quantity');

        $summary = [
            'total_products_analyzed' => $forecastProducts->count(),

            'out_of_stock' => $forecastProducts
                ->where('status', 'out_of_stock')
                ->count(),

            'critical' => $forecastProducts
                ->where('status', 'critical')
                ->count(),

            'low_stock' => $forecastProducts
                ->where('status', 'low')
                ->count(),

            'below_minimum' => $forecastProducts
                ->where('status', 'below_minimum')
                ->count(),

            'healthy' => $forecastProducts
                ->where('status', 'healthy')
                ->count(),

            'products_to_restock' => $forecastProducts
                ->filter(fn($product) => $product['recommended_quantity'] > 0)
                ->count(),

            'total_recommended_quantity' => round(
                $totalRecommendedQuantity,
                3
            ),
        ];

        // RESPONSE

        return [
            'meta' => [
                'analysis_days' => $this->analysisDays,

                'target_coverage_days' => $this->targetCoverageDays,

                'critical_days' => $this->criticalDays,

                'low_stock_days' => $this->lowStockDays,

                'start_date' => $startDate->toDateString(),

                'end_date' => $endDate->toDateString(),
            ],

            'summary' => $summary,

            'restockRecommendations' => $restockRecommendations,

            'fastMovingProducts' => $fastMovingProducts,

            'products' => $sortedForecast,
        ];
    }
}
