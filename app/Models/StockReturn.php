<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockReturn extends Model
{
    protected $fillable = [
        'reference_number',
        'stock_out_id',
        'return_date',
        'total_quantity',
        'total_amount',
        'status',
        'reason',
        'created_by',
    ];

    protected $casts = [
        'return_date' => 'date',
        'total_quantity' => 'decimal:3',
        'total_amount' => 'decimal:2',
    ];

    public function stockOut(): BelongsTo
    {
        return $this->belongsTo(StockOut::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockReturnItem::class);
    }
}
