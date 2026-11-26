<?php

namespace App\Exports\Inventory;

use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class InventoryReportsExport implements Export, WithMultipleSheets
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function sheets(): array
    {
        return [
            new StockSummarySheet($this->filters),
            new StockMovementSheet($this->filters),
        ];
    }
}
