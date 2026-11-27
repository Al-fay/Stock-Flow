<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StockFlowNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected array $payload
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->payload['title'] ?? 'Notification',
            'message' => $this->payload['message'] ?? '',
            'type' => $this->payload['type'] ?? 'info',
            'icon' => $this->payload['icon'] ?? 'bell',
            'action_url' => $this->payload['action_url'] ?? null,
            'reference_id' => $this->payload['reference_id'] ?? null,
            'reference_type' => $this->payload['reference_type'] ?? null,
        ];
    }
}
