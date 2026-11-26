<?php

namespace App\Exports\Inventory;

use App\Models\StockMovement;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockMovementSheet implements FromQuery, WithHeadings, WithMapping, WithTitle
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function query(): Builder
    {
        return StockMovement::query()
            ->with(['product.category', 'product.unit', 'user'])
            ->when($this->filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('reference_number', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('product', function ($productQuery) use ($search) {
                            $productQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('sku', 'like', "%{$search}%");
                        });
                });
            })
            ->when($this->filters['category_id'] ?? null, function ($query, $categoryId) {
                $query->whereHas('product', function ($productQuery) use ($categoryId) {
                    $productQuery->where('category_id', $categoryId);
                });
            })
            ->when($this->filters['product_id'] ?? null, function ($query, $productId) {
                $query->where('product_id', $productId);
            })
            ->when($this->filters['movement_type'] ?? null, function ($query, $type) {
                $query->where('movement_type', $type);
            })
            ->when($this->filters['date_from'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', '>=', $date);
            })
            ->when($this->filters['date_to'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', '<=', $date);
            })
            ->latest();
    }

    private function getPeriodLabel(): string
    {
        $from = $this->filters['date_from'] ?? null;
        $to = $this->filters['date_to'] ?? null;

        if ($from && $to) {
            return "Period: {$from} to {$to}";
        }

        if ($from) {
            return "Period: From {$from}";
        }

        if ($to) {
            return "Period: Until {$to}";
        }

        return 'Period: All Dates';
    }

    public function headings(): array
    {
        return [
            ['STOCK MOVEMENT REPORT'],
            [$this->getPeriodLabel()],
            ['Exported At: ' . now()->format('d F Y H:i:s')],
            [],
            [
                'Date',
                'Reference',
                'SKU',
                'Product',
                'Category',
                'Movement Type',
                'Quantity',
                'Unit',
                'User',
                'Notes',
            ],
        ];
    }

    public function columnFormats(): array
    {
        return [
            'A' => 'dd/mm/yyyy',
            'G' => '#,##0.000;[Red]-#,##0.000',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                $lastRow = $sheet->getHighestRow();

                // Border tabel
                $sheet->getStyle("A5:J{$lastRow}")
                    ->getBorders()
                    ->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN);

                $sheet->getStyle("A5:J{$lastRow}")
                    ->getBorders()
                    ->getAllBorders()
                    ->getColor()
                    ->setARGB('FFD9D9D9');

                // Zebra rows
                for ($row = 6; $row < $lastRow; $row++) {
                    if ($row % 2 === 0) {
                        $sheet->getStyle("A{$row}:J{$row}")
                            ->getFill()
                            ->setFillType('solid')
                            ->getStartColor()
                            ->setARGB('FFF5F7FA');
                    }
                }

                // Summary rows
                $summaryStart = $lastRow + 1;
                $hasData = $lastRow >= 6;

                $sheet->setCellValue("F{$summaryStart}", 'TOTAL STOCK IN');
                $sheet->setCellValue(
                    "G{$summaryStart}",
                    $hasData
                        ? "=SUMIF(G6:G{$lastRow},\">0\",G6:G{$lastRow})"
                        : 0
                );

                $sheet->setCellValue("F" . ($summaryStart + 1), 'TOTAL STOCK OUT');
                $sheet->setCellValue(
                    "G" . ($summaryStart + 1),
                    "=ABS(SUMIF(G6:G{$lastRow},\"<0\",G6:G{$lastRow}))"
                );

                $sheet->setCellValue("F" . ($summaryStart + 2), 'NET MOVEMENT');
                $sheet->setCellValue(
                    "G" . ($summaryStart + 2),
                    "=SUM(G6:G{$lastRow})"
                );

                // Styling summary
                $sheet->getStyle("F{$summaryStart}:G" . ($summaryStart + 2))
                    ->getFont()
                    ->setBold(true);

                $summaryStyle = $sheet->getStyle(
                    "F{$summaryStart}:G" . ($summaryStart + 2)
                );

                $summaryStyle->getBorders()
                    ->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN);

                $summaryStyle->getBorders()
                    ->getAllBorders()
                    ->getColor()
                    ->setARGB('FFD9D9D9');

                $sheet->getStyle("F{$summaryStart}:G{$summaryStart}")
                    ->getFill()
                    ->setFillType('solid')
                    ->getStartColor()
                    ->setARGB('FFE8F5E9');

                $sheet->getStyle("F" . ($summaryStart + 1) . ":G" . ($summaryStart + 1))
                    ->getFill()
                    ->setFillType('solid')
                    ->getStartColor()
                    ->setARGB('FFFFEBEE');

                $sheet->getStyle("F" . ($summaryStart + 2) . ":G" . ($summaryStart + 2))
                    ->getFill()
                    ->setFillType('solid')
                    ->getStartColor()
                    ->setARGB('FFE8EAF6');

                $sheet->getStyle("G{$summaryStart}:G" . ($summaryStart + 2))
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.000');

                // Freeze
                $sheet->freezePane('A6');

                // Header height
                $sheet->getRowDimension(5)->setRowHeight(28);
            },
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->mergeCells('A1:J1');
        $sheet->mergeCells('A2:J2');
        $sheet->mergeCells('A3:J3');

        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 18,
                ],
                'alignment' => [
                    'horizontal' => 'center',
                ],
            ],
            2 => [
                'font' => [
                    'italic' => true,
                    'size' => 11,
                ],
                'alignment' => [
                    'horizontal' => 'center',
                ],
            ],
            3 => [
                'font' => [
                    'size' => 10,
                    'color' => ['argb' => 'FF666666'],
                ],
                'alignment' => [
                    'horizontal' => 'center',
                ],
            ],
            5 => [
                'font' => [
                    'bold' => true,
                    'color' => ['argb' => 'FFFFFFFF'],
                ],
                'fill' => [
                    'fillType' => 'solid',
                    'startColor' => ['argb' => 'FF635BFF'],
                ],
                'alignment' => [
                    'horizontal' => 'center',
                    'vertical' => 'center',
                ],
            ],
        ];
    }

    public function map($movement): array
    {
        return [
            $movement->created_at?->format('Y-m-d H:i:s'),
            $movement->reference_number,
            $movement->product?->sku ?? '-',
            $movement->product?->name ?? '-',
            $movement->product?->category?->name ?? '-',
            $movement->movement_type,
            (float) $movement->quantity,
            $movement->product?->unit?->symbol
                ?? $movement->product?->unit?->name
                ?? '-',
            $movement->user?->name ?? '-',
            $movement->notes ?? '-',
        ];
    }

    public function title(): string
    {
        return 'Stock Movement';
    }
}
