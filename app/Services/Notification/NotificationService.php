<?php

namespace App\Services\Notification;

use App\Models\User;
use App\Notifications\StockFlowNotification;
use Illuminate\Database\Eloquent\Collection;

class NotificationService
{
    public function send(
        User $user,
        array $payload
    ): void {
        $user->notify(
            new StockFlowNotification($payload)
        );
    }

    public function sendToUsers(
        Collection $users,
        array $payload
    ): void {
        foreach ($users as $user) {
            $this->send($user, $payload);
        }
    }

    public function sendToAllUsers(
        array $payload
    ): void {
        User::query()
            ->chunkById(100, function ($users) use ($payload) {
                $this->sendToUsers($users, $payload);
            });
    }

    public function stockCritical(
        User $user,
        string $productName,
        int|string $productId,
        float $currentStock
    ): void {
        $this->send($user, [
            'title' => 'Critical Stock Alert',
            'message' => "{$productName} has critically low stock. Current stock: {$currentStock}.",
            'type' => 'critical',
            'icon' => 'triangle-alert',
            'action_url' => "/master-data/products/{$productId}",
            'reference_id' => $productId,
            'reference_type' => 'product',
        ]);
    }

    public function stockLow(
        User $user,
        string $productName,
        int|string $productId,
        float $currentStock
    ): void {
        $this->send($user, [
            'title' => 'Low Stock Alert',
            'message' => "{$productName} is below its minimum stock. Current stock: {$currentStock}.",
            'type' => 'warning',
            'icon' => 'package',
            'action_url' => "/master-data/products/{$productId}",
            'reference_id' => $productId,
            'reference_type' => 'product',
        ]);
    }

    public function stockOutOfStock(
        User $user,
        string $productName,
        int|string $productId
    ): void {
        $this->send($user, [
            'title' => 'Out of Stock',
            'message' => "{$productName} is currently out of stock.",
            'type' => 'danger',
            'icon' => 'package-x',
            'action_url' => "/master-data/products/{$productId}",
            'reference_id' => $productId,
            'reference_type' => 'product',
        ]);
    }

    public function stockIn(
        User $user,
        string $referenceNumber,
        int|string $movementId
    ): void {
        $this->send($user, [
            'title' => 'Stock In Completed',
            'message' => "Stock In transaction {$referenceNumber} has been completed.",
            'type' => 'success',
            'icon' => 'package-plus',
            'action_url' => "/inventory/stock-in/{$referenceNumber}",
            'reference_id' => $movementId,
            'reference_type' => 'stock_in',
        ]);
    }

    public function stockOut(
        User $user,
        string $referenceNumber,
        int|string $movementId
    ): void {
        $this->send($user, [
            'title' => 'Stock Out Completed',
            'message' => "Stock Out transaction {$referenceNumber} has been completed.",
            'type' => 'info',
            'icon' => 'package-minus',
            'action_url' => "/inventory/stock-out/{$referenceNumber}",
            'reference_id' => $movementId,
            'reference_type' => 'stock_out',
        ]);
    }

    public function stockReturn(
        User $user,
        string $referenceNumber,
        int|string $returnId
    ): void {
        $this->send($user, [
            'title' => 'Stock Return Completed',
            'message' => "Stock Return transaction {$referenceNumber} has been completed.",
            'type' => 'success',
            'icon' => 'rotate-ccw',
            'action_url' => "/inventory/stock-return/{$referenceNumber}",
            'reference_id' => $returnId,
            'reference_type' => 'stock_return',
        ]);
    }
}
