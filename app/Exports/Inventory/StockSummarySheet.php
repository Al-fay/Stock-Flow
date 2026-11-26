<?php

namespace App\Exports\Inventory;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockSummarySheet implements
    FromQuery,
    WithHeadings,
    WithMapping,
    WithTitle,
    WithStyles,
    ShouldAutoSize,
    WithColumnFormatting,
    WithEvents
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function query(): Builder
    {
        $query = Product::query()
            ->with(['category', 'unit']);

        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if (!empty($this->filters['category_id'])) {
            $query->where('category_id', $this->filters['category_id']);
        }

        if (!empty($this->filters['product_id'])) {
            $query->where('id', $this->filters['product_id']);
        }

        return $query->orderBy('name');
    }

    public function headings(): array
    {
        return [
            ['STOCK SUMMARY REPORT'],
            [$this->getPeriodLabel()],
            ['Exported At: ' . now()->format('d F Y H:i:s')],
            [],
            [
                'No',
                'SKU',
                'Product',
                'Category',
                'Stock',
                'Unit',
                'Purchase Price',
                'Selling Price',
                'Inventory Value',
                'Potential Selling Value',
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                $lastRow = $sheet->getHighestRow();

                // Border seluruh tabel
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

                // Total row
                $totalRow = $lastRow + 1;

                $sheet->setCellValue("A{$totalRow}", 'TOTAL');
                $sheet->setCellValue(
                    "E{$totalRow}",
                    $lastRow >= 6 ? "=SUM(E6:E{$lastRow})" : 0
                );

                $sheet->setCellValue(
                    "I{$totalRow}",
                    "=SUM(I6:I{$lastRow})"
                );

                $sheet->setCellValue(
                    "J{$totalRow}",
                    "=SUM(J6:J{$lastRow})"
                );

                // Styling total
                $sheet->getStyle("A{$totalRow}:J{$totalRow}")
                    ->getFont()
                    ->setBold(true);

                $sheet->getStyle("A{$totalRow}:J{$totalRow}")
                    ->getFill()
                    ->setFillType('solid')
                    ->getStartColor()
                    ->setARGB('FFE8EAF6');

                $sheet->getStyle("A{$totalRow}:J{$totalRow}")
                    ->getBorders()
                    ->getTop()
                    ->setBorderStyle(Border::BORDER_MEDIUM);

                // Format total
                $sheet->getStyle("E{$totalRow}")
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.000');

                foreach (['I', 'J'] as $column) {
                    $sheet->getStyle("{$column}{$totalRow}")
                        ->getNumberFormat()
                        ->setFormatCode('"Rp" #,##0');
                }

                // Alignment
                $sheet->getStyle("A6:A{$totalRow}")
                    ->getAlignment()
                    ->setHorizontal('center');

                $sheet->getStyle("E6:E{$totalRow}")
                    ->getAlignment()
                    ->setHorizontal('right');

                // Freeze
                $sheet->freezePane('A6');

                // Header height
                $sheet->getRowDimension(5)->setRowHeight(28);
            },
        ];
    }

    public function columnFormats(): array
    {
        return [
            'E' => '#,##0.000',
            'G' => '"Rp" #,##0',
            'H' => '"Rp" #,##0',
            'I' => '"Rp" #,##0',
            'J' => '"Rp" #,##0',
        ];
    }

    public function map($product): array
    {
        static $number = 0;

        $number++;

        return [
            $number,
            $product->sku,
            $product->name,
            $product->category?->name ?? '-',
            $product->stock,
            $product->unit?->name ?? '-',
            $product->purchase_price,
            $product->selling_price,
            $product->stock * $product->purchase_price,
            $product->stock * $product->selling_price,
        ];
    }

    public function title(): string
    {
        return 'Stock Summary';
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

    private function getPeriodLabel(): string
    {
        $from = $this->filters['date_from'] ?? null;
        $to = $this->filters['date_to'] ?? null;

        if ($from && $to) {
            return "Movement Filter Period: {$from} – {$to} | Stock as of export date";
        }

        if ($from) {
            return "Movement Filter From: {$from} | Stock as of export date";
        }

        if ($to) {
            return "Movement Filter Until: {$to} | Stock as of export date";
        }

        return 'Period: All Dates | Stock as of export date';
    }
}
