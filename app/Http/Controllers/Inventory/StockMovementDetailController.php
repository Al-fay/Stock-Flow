<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\StockOpname;
use Inertia\Inertia;

class StockMovementDetailController extends Controller
{
    public function show(StockMovement $movement)
    {
        $movement->load([
            'product.unit',
            'supplier',
            'user',
        ]);

        $reference = $movement->reference_number;

        $relatedMovements = StockMovement::query()
            ->when(
                $reference,
                fn($query) => $query->where(
                    'reference_number',
                    $reference
                ),
                fn($query) => $query->whereKey($movement->id)
            )
            ->with([
                'product:id,sku,name,unit_id',
                'product.unit:id,name,symbol',
                'supplier:id,name',
                'user:id,name',
            ])
            ->orderBy('id')
            ->get();

        $stockIn = null;
        $stockOut = null;
        $stockOpname = null;

        if ($reference) {
            $stockIn = StockIn::query()
                ->with([
                    'supplier:id,name',
                    'creator:id,name',
                    'items.product:id,sku,name,unit_id',
                    'items.product.unit:id,name,symbol',
                ])
                ->where('reference_number', $reference)
                ->first();

            $stockOut = StockOut::query()
                ->with([
                    'creator:id,name',
                    'items.product:id,sku,name,unit_id',
                    'items.product.unit:id,name,symbol',
                ])
                ->where('reference_number', $reference)
                ->first();

            $stockOpname = StockOpname::query()
                ->with([
                    'creator:id,name',
                    'poster:id,name',
                    'items.product:id,sku,name,unit_id',
                    'items.product.unit:id,name,symbol',
                ])
                ->where('code', $reference)
                ->first();
        }

        $transactionType = match (true) {
            $stockIn !== null => 'STOCK_IN',
            $stockOut !== null => 'STOCK_OUT',
            $stockOpname !== null => 'STOCK_OPNAME',
            default => 'MOVEMENT',
        };

        return Inertia::render(
            'inventory/movements/show',
            [
                'movement' => $movement,
                'relatedMovements' => $relatedMovements,
                'transaction' => [
                    'type' => $transactionType,
                    'stockIn' => $stockIn,
                    'stockOut' => $stockOut,
                    'stockOpname' => $stockOpname,
                ],
            ]
        );
    }
}
