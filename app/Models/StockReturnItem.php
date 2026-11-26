<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockReturnItem extends Model
{
    protected $fillable = [
        'stock_return_id',
        'stock_out_item_id',
        'product_id',
        'quantity',
        'unit_price',
        'subtotal',
        'restock_quantity',
        'damaged_quantity',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'restock_quantity' => 'decimal:3',
        'damaged_quantity' => 'decimal:3',
    ];

    public function stockReturn(): BelongsTo
    {
        return $this->belongsTo(StockReturn::class);
    }

    public function stockOutItem(): BelongsTo
    {
        return $this->belongsTo(StockOutItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
