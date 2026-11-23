<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class StockOverviewController extends Controller
{
    public function index(): Response
    {
        // Hanya produk aktif yang belum dihapus.
        $activeProducts = Product::query()
            ->where('is_active', true);

        // Ringkasan persediaan.
        $summary = [
            'total_products' => (clone $activeProducts)->count(),

            'total_stock' => (clone $activeProducts)
                ->sum('stock'),

            'inventory_value' => (clone $activeProducts)
                ->selectRaw('COALESCE(SUM(stock * purchase_price), 0) as total')
                ->first()?->total ?? 0,

            'low_stock_count' => (clone $activeProducts)
                ->whereColumn('stock', '<=', 'minimum_stock')
                ->count(),

            'out_of_stock_count' => (clone $activeProducts)
                ->where('stock', '<=', 0)
                ->count(),
        ];

        // Produk dengan stok menipis.
        $lowStockProducts = Product::query()
            ->with([
                'category:id,name',
                'unit:id,name,symbol',
            ])
            ->where('is_active', true)
            ->whereColumn('stock', '<=', 'minimum_stock')
            ->orderBy('stock')
            ->limit(10)
            ->get([
                'id',
                'category_id',
                'unit_id',
                'sku',
                'name',
                'stock',
                'minimum_stock',
            ]);

        // Grafik pergerakan stok selama 7 hari terakhir.
        $startDate = Carbon::today()->subDays(6);
        $endDate = Carbon::today()->endOfDay();

        $movementRows = StockMovement::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('CAST(created_at AS DATE) as movement_date')
            ->selectRaw(
                'SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END) as stock_in'
            )
            ->selectRaw(
                'SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END) as stock_out'
            )
            ->groupByRaw('CAST(created_at AS DATE)')
            ->orderBy('movement_date')
            ->get()
            ->keyBy(fn($row) => Carbon::parse($row->movement_date)->format('Y-m-d'));

        $movementChart = [];

        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i);
            $key = $date->format('Y-m-d');
            $movement = $movementRows->get($key);

            $movementChart[] = [
                'date' => $key,
                'label' => $date->translatedFormat('d M'),
                'stock_in' => (float) ($movement->stock_in ?? 0),
                'stock_out' => (float) ($movement->stock_out ?? 0),
            ];
        }

        // Riwayat transaksi terbaru.
        $recentMovements = StockMovement::query()
            ->with([
                'product:id,sku,name',
                'supplier:id,code,name',
                'user:id,name',
            ])
            ->latest('created_at')
            ->limit(8)
            ->get();

        return Inertia::render('inventory/overview', [
            'summary' => $summary,
            'lowStockProducts' => $lowStockProducts,
            'movementChart' => $movementChart,
            'recentMovements' => $recentMovements,
        ]);
    }
}
