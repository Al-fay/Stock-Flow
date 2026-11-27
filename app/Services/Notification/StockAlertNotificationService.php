<?php

namespace App\Services\Notification;

use App\Models\Product;
use App\Models\StockAlertState;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StockAlertNotificationService
{
    /**
     * Evaluate stock alert for a product.
     */
    public function evaluateProduct(Product $product): void
    {
        if (!$product->is_active) {
            return;
        }

        DB::transaction(function () use ($product) {

            $product = Product::query()
                ->lockForUpdate()
                ->find($product->id);

            if (!$product || !$product->is_active) {
                return;
            }

            $stock = (float) $product->stock;

            $minimumStock = (float) $product->minimum_stock;

            $averageDailyOut = $this->calculateAverageDailyOut(
                $product
            );

            $coverageDays = $averageDailyOut > 0
                ? $stock / $averageDailyOut
                : null;

            $status = $this->determineStatus(
                $stock,
                $minimumStock,
                $coverageDays
            );

            $state = StockAlertState::query()
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->first();

            if (!$state) {
                $state = StockAlertState::create([
                    'product_id' => $product->id,
                    'status' => 'normal',
                ]);
            }

            $previousStatus = $state->status;

            $state->status = $status;

            /*
             * Reset when stock becomes normal.
             */
            if ($status === 'normal') {
                $state->last_notified_status = null;
                $state->last_notified_at = null;

                $state->save();

                return;
            }

            /*
             * Don't send duplicate notification
             * when the status hasn't changed.
             */
            if (
                $state->last_notified_status === $status
            ) {
                $state->save();

                return;
            }

            /*
             * Send alert when:
             * - First time entering alert status
             * - Severity changes
             */
            $this->sendNotification(
                $product,
                $status,
                $stock
            );

            $state->last_notified_status = $status;
            $state->last_notified_at = now();

            $state->save();
        });
    }

    /**
     * Determine stock status.
     */
    protected function determineStatus(
        float $stock,
        float $minimumStock,
        ?float $coverageDays
    ): string {
        if ($stock <= 0) {
            return 'out_of_stock';
        }

        if (
            $coverageDays !== null &&
            $coverageDays <= 3
        ) {
            return 'critical';
        }

        if (
            (
                $coverageDays !== null &&
                $coverageDays <= 7
            ) ||
            $stock <= $minimumStock
        ) {
            return 'low';
        }

        return 'normal';
    }

    /**
     * Calculate average daily stock out
     * using the last 30 days.
     */
    protected function calculateAverageDailyOut(
        Product $product
    ): float {
        $startDate = now()->subDays(30);

        $totalOut = StockMovement::query()
            ->where('product_id', $product->id)
            ->where('movement_type', 'OUT')
            ->where('created_at', '>=', $startDate)
            ->sum(DB::raw('ABS(quantity)'));

        /*
         * Match forecast analysis period:
         * 30 days, adjusted for product age.
         */
        $analysisDays = max(
            1,
            min(
                30,
                (int) $product->created_at
                    ->diffInDays(now()) + 1
            )
        );

        return (float) $totalOut / $analysisDays;
    }

    /**
     * Send notification based on status.
     */
    protected function sendNotification(
        Product $product,
        string $status,
        float $stock
    ): void {
        $users = User::query()->get();

        foreach ($users as $user) {
            $notificationService = app(NotificationService::class);

            switch ($status) {
                case 'out_of_stock':

                    $notificationService->stockOutOfStock(
                        $user,
                        $product->name,
                        $product->id
                    );

                    break;

                case 'critical':

                    $notificationService->stockCritical(
                        $user,
                        $product->name,
                        $product->id,
                        $stock
                    );

                    break;

                case 'low':

                    $notificationService->stockLow(
                        $user,
                        $product->name,
                        $product->id,
                        $stock
                    );

                    break;
            }
        }
    }
}
