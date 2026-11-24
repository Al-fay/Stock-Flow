<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $total = Product::count();
        $outOfStock = Product::where('stock', '<=', 0)->count();
        $lowStock = Product::where('stock', '>', 0)
            ->whereColumn('stock', '<=', 'minimum_stock')
            ->count();
        $inStock = max($total - $outOfStock - $lowStock, 0);

        $percent = fn(int $n) => $total > 0 ? round($n / $total * 100) : 0;

        $days = collect(range(6, 0))->map(fn($i) => now()->subDays($i)->startOfDay());

        $counts = Product::where('created_at', '>=', $days->first())
            ->selectRaw('DATE(created_at) as d, COUNT(*) as total')
            ->groupBy('d')
            ->pluck('total', 'd');

        $chart = $days->map(fn($day) => [
            'day' => $day->format('D'),
            'value' => (int) ($counts[$day->toDateString()] ?? 0),
        ])->values();

        $recentProducts = Product::query()
            ->with(['category:id,name', 'unit:id,symbol'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn(Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'category' => $p->category?->name ?? '-',
                'unit' => $p->unit?->symbol,
                'stock' => (float) $p->stock,
                'price' => (float) $p->selling_price,
                'status' => $p->stock <= 0
                    ? 'Out of Stock'
                    : ($p->stock <= $p->minimum_stock ? 'Low Stock' : 'In Stock'),
            ]);

        return Inertia::render('dashboard/index', [
            'stats' => [
                'total_products' => $total,
                'active_products' => Product::where('is_active', true)->count(),
                'stock_value' => (float) Product::sum(DB::raw('stock * purchase_price')),
                'low_stock' => $lowStock + $outOfStock,
            ],
            'inventorySummary' => [
                ['name' => 'In Stock', 'value' => $percent($inStock), 'color' => 'bg-emerald-500'],
                ['name' => 'Low Stock', 'value' => $percent($lowStock), 'color' => 'bg-amber-500'],
                ['name' => 'Out of Stock', 'value' => $percent($outOfStock), 'color' => 'bg-red-500'],
            ],
            'chart' => $chart,
            'recentProducts' => $recentProducts,
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'units' => Unit::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'symbol']),
        ]);
    }
}
