<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOut extends Model
{
    protected $fillable = [
        'reference_number',
        'transaction_date',
        'transaction_type',
        'destination',
        'total_quantity',
        'total_amount',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'total_quantity' => 'decimal:3',
        'total_amount' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(StockOutItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
