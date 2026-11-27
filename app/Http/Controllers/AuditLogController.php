<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    /**
     * Audit Log Index
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'module' => ['nullable', 'string', 'max:100'],
            'action' => ['nullable', 'string', 'max:50'],
            'user_id' => ['nullable', 'integer'],
            'start_date' => ['nullable', 'date'],
            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
            'per_page' => [
                'nullable',
                'integer',
                'in:10,25,50,100',
            ],
        ]);

        $query = AuditLog::query()
            ->with([
                'user:id,name',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhere('auditable_id', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Module Filter
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        /*
        |--------------------------------------------------------------------------
        | Action Filter
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        /*
        |--------------------------------------------------------------------------
        | User Filter
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        /*
        |--------------------------------------------------------------------------
        | Date Filter
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['start_date'])) {
            $query->whereDate(
                'created_at',
                '>=',
                $filters['start_date']
            );
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate(
                'created_at',
                '<=',
                $filters['end_date']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $perPage = $filters['per_page'] ?? 10;

        $auditLogs = $query
            ->latest('created_at')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        /*
        |--------------------------------------------------------------------------
        | Filter Options
        |--------------------------------------------------------------------------
        */

        $modules = AuditLog::query()
            ->whereNotNull('module')
            ->distinct()
            ->orderBy('module')
            ->pluck('module')
            ->values();

        $actions = AuditLog::query()
            ->whereNotNull('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->values();

        $userIds = AuditLog::query()
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('user_id');

        $users = User::query()
            ->whereIn('id', $userIds)
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Summary
        |--------------------------------------------------------------------------
        */

        $summaryQuery = AuditLog::query();

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $summaryQuery->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhere('auditable_id', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($filters['module'])) {
            $summaryQuery->where('module', $filters['module']);
        }

        if (!empty($filters['action'])) {
            $summaryQuery->where('action', $filters['action']);
        }

        if (!empty($filters['user_id'])) {
            $summaryQuery->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['start_date'])) {
            $summaryQuery->whereDate(
                'created_at',
                '>=',
                $filters['start_date']
            );
        }

        if (!empty($filters['end_date'])) {
            $summaryQuery->whereDate(
                'created_at',
                '<=',
                $filters['end_date']
            );
        }

        $summary = [
            'total_logs' => (clone $summaryQuery)->count(),

            'today_logs' => AuditLog::query()
                ->whereDate('created_at', today())
                ->count(),

            'total_users' => (clone $summaryQuery)
                ->whereNotNull('user_id')
                ->distinct()
                ->count('user_id'),

            'total_modules' => (clone $summaryQuery)
                ->whereNotNull('module')
                ->distinct()
                ->count('module'),
        ];

        return Inertia::render('audit-logs/index', [
            'auditLogs' => $auditLogs,

            'summary' => $summary,

            'options' => [
                'modules' => $modules,
                'actions' => $actions,
                'users' => $users,
            ],

            'filters' => [
                'search' => $filters['search'] ?? '',
                'module' => $filters['module'] ?? '',
                'action' => $filters['action'] ?? '',
                'user_id' => $filters['user_id'] ?? '',
                'start_date' => $filters['start_date'] ?? '',
                'end_date' => $filters['end_date'] ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Audit Log Detail
     */
    public function show(AuditLog $auditLog)
    {
        $auditLog->load([
            'user:id,name',
            'auditable',
        ]);

        return Inertia::render('audit-logs/show', [
            'auditLog' => $auditLog,
        ]);
    }
}
