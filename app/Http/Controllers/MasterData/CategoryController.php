<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'in:code,name,created_at'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $categories = Category::query()
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
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

        return Inertia::render('master-data/categories/index', [
            'categories' => $categories,
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
            'code' => ['required', 'string', 'max:50', 'unique:categories,code'],
            'name' => ['required', 'string', 'max:150', 'unique:categories,name'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        Category::create($validated);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('categories', 'code')->ignore($category->id),
            ],
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $category->update($validated);

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return back()->with('success', 'Kategori berhasil dihapus.');
    }
}
