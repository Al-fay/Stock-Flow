<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    public function log(
        string $action,
        string $module,
        string $description,
        ?Model $auditable = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        array $metadata = [],
    ): AuditLog {
        return AuditLog::create([
            'user_id' => Auth::id(),

            'action' => strtoupper($action),

            'module' => strtoupper($module),

            'description' => $description,

            'auditable_type' => $auditable?->getMorphClass(),

            'auditable_id' => $auditable?->getKey(),

            'old_values' => $oldValues,

            'new_values' => $newValues,

            'metadata' => !empty($metadata)
                ? $metadata
                : null,

            'ip_address' => request()->ip(),

            'user_agent' => request()->userAgent(),
        ]);
    }

    public function created(
        Model $model,
        string $module,
        string $description,
        array $metadata = [],
    ): AuditLog {
        return $this->log(
            action: 'CREATE',
            module: $module,
            description: $description,
            auditable: $model,
            newValues: $model->getAttributes(),
            metadata: $metadata,
        );
    }

    public function updated(
        Model $model,
        string $module,
        string $description,
        array $oldValues,
        array $newValues,
        array $metadata = [],
    ): AuditLog {
        return $this->log(
            action: 'UPDATE',
            module: $module,
            description: $description,
            auditable: $model,
            oldValues: $oldValues,
            newValues: $newValues,
            metadata: $metadata,
        );
    }

    public function deleted(
        Model $model,
        string $module,
        string $description,
        array $metadata = [],
    ): AuditLog {
        return $this->log(
            action: 'DELETE',
            module: $module,
            description: $description,
            auditable: $model,
            oldValues: $model->getAttributes(),
            metadata: $metadata,
        );
    }
}
