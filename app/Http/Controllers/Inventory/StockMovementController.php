<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'in:IN,OUT,ADJUSTMENT,DAMAGE'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = StockMovement::with([
            'product:id,sku,name,unit_id',
            'product.unit:id,name,symbol',
            'supplier:id,name',
            'user:id,name',
        ]);

        // Search
        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($productQuery) use ($search) {
                        $productQuery->where('sku', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                        $supplierQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter type
        if (!empty($validated['type'])) {
            $query->where('movement_type', $validated['type']);
        }

        // Filter date
        if (!empty($validated['start_date'])) {
            $query->whereDate('created_at', '>=', $validated['start_date']);
        }

        if (!empty($validated['end_date'])) {
            $query->whereDate('created_at', '<=', $validated['end_date']);
        }

        /*
        |--------------------------------------------------------------------------
        | Summary
        |--------------------------------------------------------------------------
        */

        $summary = (clone $query)
            ->selectRaw("
                COUNT(*) AS total_transactions,

                COALESCE(SUM(
                    CASE
                        WHEN movement_type = 'IN'
                        THEN ABS(quantity)
                        ELSE 0
                    END
                ), 0) AS total_in,

                COALESCE(SUM(
                    CASE
                        WHEN movement_type = 'OUT'
                        THEN ABS(quantity)
                        ELSE 0
                    END
                ), 0) AS total_out,

                COALESCE(SUM(
                    CASE
                        WHEN movement_type = 'ADJUSTMENT'
                        THEN ABS(quantity)
                        ELSE 0
                    END
                ), 0) AS total_adjustment,

                COALESCE(SUM(
                    CASE
                        WHEN movement_type = 'DAMAGE'
                        THEN ABS(quantity)
                        ELSE 0
                    END
                ), 0) AS total_damage
            ")
            ->first();

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $movements = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return Inertia::render('inventory/movements/index', [
            'movements' => $movements,

            'summary' => [
                'total_transactions' => (int) $summary->total_transactions,
                'total_in' => (float) $summary->total_in,
                'total_out' => (float) $summary->total_out,
                'total_adjustment' => (float) $summary->total_adjustment,
                'total_damage' => (float) $summary->total_damage,
            ],

            'filters' => [
                'search' => $validated['search'] ?? '',
                'type' => $validated['type'] ?? '',
                'start_date' => $validated['start_date'] ?? '',
                'end_date' => $validated['end_date'] ?? '',
            ],
        ]);
    }
}
