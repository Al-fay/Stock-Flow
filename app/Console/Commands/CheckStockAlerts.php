<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\Notification\StockAlertNotificationService;
use Illuminate\Console\Command;

class CheckStockAlerts extends Command
{
    protected $signature = 'stock:check-alerts';

    protected $description = 'Check inventory stock alerts for all active products';

    public function handle(
        StockAlertNotificationService $service
    ): int {
        $this->info('Checking stock alerts...');

        $total = 0;

        Product::query()
            ->where('is_active', true)
            ->chunkById(100, function ($products) use (
                $service,
                &$total
            ) {
                foreach ($products as $product) {
                    $service->evaluateProduct($product);

                    $total++;
                }
            });

        $this->info(
            "Stock alert checking completed. {$total} products evaluated."
        );

        return self::SUCCESS;
    }
}
