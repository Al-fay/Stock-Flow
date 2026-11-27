<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <title>Inventory Reports</title>

    <style>
        @page {
            margin: 25px 25px 45px 25px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9px;
            color: #1f2937;
        }

        .company-name {
            font-size: 13px;
            font-weight: bold;
            color: #635bff;
            margin-bottom: 5px;
        }

        .report-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #635bff;
        }

        .report-title {
            font-size: 20px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 8px;
        }

        .report-subtitle {
            color: #6b7280;
            font-size: 9px;
            line-height: 1.6;
        }

        .summary-grid {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: separate;
            border-spacing: 6px;
        }

        .summary-card {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            padding: 10px;
        }

        .summary-label {
            color: #6b7280;
            font-size: 8px;
            margin-bottom: 5px;
        }

        .summary-value {
            font-size: 12px;
            font-weight: bold;
        }

        table.report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        table.report-table thead {
            display: table-header-group;
        }

        table.report-table th {
            background: #635bff;
            color: #ffffff;
            padding: 7px 5px;
            text-align: center;
            border: 1px solid #5148e5;
            font-size: 8px;
        }

        table.report-table td {
            padding: 5px;
            border: 1px solid #d1d5db;
            vertical-align: middle;
        }

        table.report-table tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        tfoot {
            display: table-footer-group;
        }

        tr {
            page-break-inside: avoid;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .total-row {
            background: #e8eaf6 !important;
            font-weight: bold;
        }

        .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #111827;
        }

        .section {
            margin-bottom: 15px;
        }

        .page-break {
            page-break-before: always;
        }

        .badge {
            padding: 3px 5px;
            font-weight: bold;
        }

        .positive {
            color: #15803d;
        }

        .negative {
            color: #dc2626;
        }

        .footer {
            position: fixed;
            bottom: -25px;
            left: 0;
            right: 0;
            height: 25px;
            font-size: 9px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            text-align: center;
        }

        .muted {
            color: #6b7280;
        }

        .empty-state {
            text-align: center;
            padding: 20px;
            color: #6b7280;
        }
    </style>
</head>

<body>

    {{-- STOCK SUMMARY --}}

    <div class="report-header">
        <div class="company-name">
            STOCK-FLOW
        </div>

        <div class="report-title">
            STOCK SUMMARY REPORT
        </div>

        <div class="report-subtitle">
            Inventory Valuation and Stock Overview
        </div>

        <div class="report-subtitle">
            @if (!empty($filters['date_from']) && !empty($filters['date_to']))
                Filter Period:
                {{ \Carbon\Carbon::parse($filters['date_from'])->format('d M Y') }}
                -
                {{ \Carbon\Carbon::parse($filters['date_to'])->format('d M Y') }}
            @elseif(!empty($filters['date_from']))
                From:
                {{ \Carbon\Carbon::parse($filters['date_from'])->format('d M Y') }}
            @elseif(!empty($filters['date_to']))
                Until:
                {{ \Carbon\Carbon::parse($filters['date_to'])->format('d M Y') }}
            @else
                Filter Period: All Dates
            @endif
        </div>

        <div class="report-subtitle">
            Generated:
            {{ $generatedAt->format('d M Y H:i') }}
        </div>
    </div>

    {{-- Summary Cards --}}

    <table class="summary-grid">
        <tr>
            <td class="summary-card">
                <div class="summary-label">
                    TOTAL PRODUCTS
                </div>

                <div class="summary-value">
                    {{ number_format($summary['total_products']) }}
                </div>
            </td>

            <td class="summary-card">
                <div class="summary-label">
                    TOTAL STOCK
                </div>

                <div class="summary-value">
                    {{ number_format($summary['total_stock'], 3) }}
                </div>
            </td>

            <td class="summary-card">
                <div class="summary-label">
                    INVENTORY VALUE
                </div>

                <div class="summary-value">
                    Rp {{ number_format($summary['total_inventory_value'], 0, ',', '.') }}
                </div>
            </td>

            <td class="summary-card">
                <div class="summary-label">
                    POTENTIAL SELLING VALUE
                </div>

                <div class="summary-value">
                    Rp {{ number_format($summary['total_potential_selling_value'], 0, ',', '.') }}
                </div>
            </td>
        </tr>
    </table>

    {{-- Stock Summary Table --}}

    <div class="section">

        <div class="section-title">
            Stock Summary Details
        </div>

        <table class="report-table">
            <thead>
                <tr>
                    <th width="4%">No</th>
                    <th width="10%">SKU</th>
                    <th width="20%">Product</th>
                    <th width="12%">Category</th>
                    <th width="8%">Stock</th>
                    <th width="7%">Unit</th>
                    <th width="10%">Purchase Price</th>
                    <th width="10%">Selling Price</th>
                    <th width="10%">Inventory Value</th>
                    <th width="10%">Potential Value</th>
                </tr>
            </thead>

            <tbody>
                @forelse($products as $index => $product)
                    <tr>
                        <td class="text-center">
                            {{ $index + 1 }}
                        </td>

                        <td>
                            {{ $product->sku }}
                        </td>

                        <td>
                            {{ $product->name }}
                        </td>

                        <td>
                            {{ $product->category?->name ?? '-' }}
                        </td>

                        <td class="text-right">
                            {{ number_format($product->stock, 3) }}
                        </td>

                        <td class="text-center">
                            {{ $product->unit?->name ?? '-' }}
                        </td>

                        <td class="text-right">
                            {{ number_format($product->purchase_price, 0, ',', '.') }}
                        </td>

                        <td class="text-right">
                            {{ number_format($product->selling_price, 0, ',', '.') }}
                        </td>

                        <td class="text-right">
                            {{ number_format($product->stock * $product->purchase_price, 0, ',', '.') }}
                        </td>

                        <td class="text-right">
                            {{ number_format($product->stock * $product->selling_price, 0, ',', '.') }}
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="10" class="empty-state">
                            No inventory data found.
                        </td>
                    </tr>
                @endforelse

                @if ($products->isNotEmpty())
                    <tr class="total-row">
                        <td colspan="4" class="text-right">
                            TOTAL
                        </td>

                        <td class="text-right">
                            {{ number_format($summary['total_stock'], 3) }}
                        </td>

                        <td></td>
                        <td></td>
                        <td></td>

                        <td class="text-right">
                            {{ number_format($summary['total_inventory_value'], 0, ',', '.') }}
                        </td>

                        <td class="text-right">
                            {{ number_format($summary['total_potential_selling_value'], 0, ',', '.') }}
                        </td>
                    </tr>
                @endif
            </tbody>
        </table>
    </div>


    {{-- ========================================================= --}}
    {{-- STOCK MOVEMENT --}}
    {{-- ========================================================= --}}

    <div class="page-break"></div>

    <div class="report-header">
        <div class="company-name">
            STOCK-FLOW
        </div>

        <div class="report-title">
            STOCK MOVEMENT REPORT
        </div>

        <div class="report-subtitle">
            Inventory Transaction History
        </div>

        <div class="report-subtitle">
            @if (!empty($filters['date_from']) && !empty($filters['date_to']))
                Period:
                {{ \Carbon\Carbon::parse($filters['date_from'])->format('d M Y') }}
                -
                {{ \Carbon\Carbon::parse($filters['date_to'])->format('d M Y') }}
            @elseif(!empty($filters['date_from']))
                From:
                {{ \Carbon\Carbon::parse($filters['date_from'])->format('d M Y') }}
            @elseif(!empty($filters['date_to']))
                Until:
                {{ \Carbon\Carbon::parse($filters['date_to'])->format('d M Y') }}
            @else
                Period: All Dates
            @endif
        </div>

        <div class="report-subtitle">
            Generated:
            {{ $generatedAt->format('d M Y H:i') }}
        </div>
    </div>

    {{-- Movement Summary --}}

    <table class="summary-grid">
        <tr>
            <td class="summary-card">
                <div class="summary-label">
                    TOTAL STOCK IN
                </div>

                <div class="summary-value positive">
                    +{{ number_format($movementSummary['total_in'], 3) }}
                </div>
            </td>

            <td class="summary-card">
                <div class="summary-label">
                    TOTAL STOCK OUT
                </div>

                <div class="summary-value negative">
                    -{{ number_format($movementSummary['total_out'], 3) }}
                </div>
            </td>

            <td class="summary-card">
                <div class="summary-label">
                    NET MOVEMENT
                </div>

                <div class="summary-value">
                    {{ number_format($movementSummary['net_movement'], 3) }}
                </div>
            </td>

            <td class="summary-card">
                <div class="summary-label">
                    TOTAL TRANSACTIONS
                </div>

                <div class="summary-value">
                    {{ number_format($movements->count()) }}
                </div>
            </td>
        </tr>
    </table>

    {{-- Movement Table --}}

    <div class="section">

        <div class="section-title">
            Stock Movement Details
        </div>

        <table class="report-table">
            <thead>
                <tr>
                    <th width="9%">Date</th>
                    <th width="12%">Reference</th>
                    <th width="9%">SKU</th>
                    <th width="18%">Product</th>
                    <th width="10%">Category</th>
                    <th width="10%">Type</th>
                    <th width="8%">Quantity</th>
                    <th width="6%">Unit</th>
                    <th width="8%">User</th>
                    <th width="10%">Notes</th>
                </tr>
            </thead>

            <tbody>
                @forelse($movements as $movement)
                    <tr>
                        <td class="text-center">
                            {{ $movement->created_at?->format('d/m/Y H:i') }}
                        </td>

                        <td>
                            {{ $movement->reference_number ?? '-' }}
                        </td>

                        <td>
                            {{ $movement->product?->sku ?? '-' }}
                        </td>

                        <td>
                            {{ $movement->product?->name ?? '-' }}
                        </td>

                        <td>
                            {{ $movement->product?->category?->name ?? '-' }}
                        </td>

                        <td class="text-center">
                            {{ $movement->movement_type }}
                        </td>

                        <td
                            class="text-right
                            {{ $movement->quantity > 0 ? 'positive' : 'negative' }}">
                            {{ $movement->quantity > 0 ? '+' : '' }}
                            {{ number_format($movement->quantity, 3) }}
                        </td>

                        <td class="text-center">
                            {{ $movement->product?->unit?->name ?? '-' }}
                        </td>

                        <td>
                            {{ $movement->user?->name ?? '-' }}
                        </td>

                        <td>
                            {{ $movement->notes ?? '-' }}
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="10" class="empty-state">
                            No stock movement data found.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- Footer --}}

    <div class="footer">
        Stock-Flow Inventory Reports
        | Generated {{ $generatedAt->format('d/m/Y H:i') }}
    </div>

</body>

</html>
