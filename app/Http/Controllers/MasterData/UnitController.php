<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class UnitController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'in:code,name,symbol,created_at'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $units = Unit::query()
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('symbol', 'like', "%{$search}%");
                });
            })
            ->when(
                $validated['sort'] ?? null,
                fn($query, $sort) => $query->orderBy(
                    $sort,
                    $validated['direction'] ?? 'asc'
                ),
                fn($query) => $query->latest()
            )
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return Inertia::render('master-data/units/index', [
            'units' => $units,
            'filters' => [
                'search' => $validated['search'] ?? '',
                'sort' => $validated['sort'] ?? 'created_at',
                'direction' => $validated['direction'] ?? 'desc',
                'per_page' => (int) ($validated['per_page'] ?? 10),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:units,code'],
            'name' => ['required', 'string', 'max:100', 'unique:units,name'],
            'symbol' => ['required', 'string', 'max:20', 'unique:units,symbol'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        Unit::create($validated);

        return back()->with('success', 'Satuan berhasil ditambahkan.');
    }

    public function update(Request $request, Unit $unit): RedirectResponse
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('units', 'code')->ignore($unit->id),
            ],
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('units', 'name')->ignore($unit->id),
            ],
            'symbol' => [
                'required',
                'string',
                'max:20',
                Rule::unique('units', 'symbol')->ignore($unit->id),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $unit->update($validated);

        return back()->with('success', 'Satuan berhasil diperbarui.');
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        if ($unit->products()->exists()) {
            return back()->withErrors([
                'delete' => 'Satuan tidak dapat dihapus karena masih digunakan oleh produk.',
            ]);
        }

        $unit->delete();

        return back()->with('success', 'Satuan berhasil dihapus.');
    }
}
