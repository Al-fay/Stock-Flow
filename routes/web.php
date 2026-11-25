<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RefreshTokenController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\Inventory\StockInController;
use App\Http\Controllers\Inventory\StockMovementController;
use App\Http\Controllers\Inventory\StockMovementDetailController;
use App\Http\Controllers\Inventory\StockOpnameController;
use App\Http\Controllers\Inventory\StockOutController;
use App\Http\Controllers\Inventory\StockOverviewController;
use App\Http\Controllers\MasterData\CategoryController;
use App\Http\Controllers\MasterData\CustomerController;
use App\Http\Controllers\MasterData\ProductController;
use App\Http\Controllers\MasterData\SupplierController;
use App\Http\Controllers\MasterData\UnitController;
use App\Http\Controllers\MasterData\WarehouseController;
use App\Http\Middleware\JwtAuthenticate;
use Illuminate\Support\Facades\Auth;

// Routes sebelum login
Route::middleware('guest')->group(function () {
    Route::get('/', function () {
        return Inertia::render('auth/sign-in');
    })->name('login');

    Route::post('/sign-in', [
        AuthenticatedSessionController::class,
        'store',
    ])->middleware('throttle:10,1');

    Route::get('/sign-up', function () {
        return Inertia::render('auth/sign-up');
    })->name('register');

    Route::post('/sign-up', [
        RegisteredUserController::class,
        'store',
    ])->middleware('throttle:3,60');
});

Route::post('/refresh-token', RefreshTokenController::class)
    ->middleware('throttle:10,1')
    ->name('token.refresh');

// Routes setelah login
Route::middleware([JwtAuthenticate::class])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/profile', function () {
        $user = Auth::user();

        return Inertia::render('Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
            ],
        ]);
    })->name('profile');

    Route::prefix('master-data')->name('master-data.')->group(function () {
        Route::get('/categories', [CategoryController::class, 'index'])
            ->name('categories.index');

        Route::post('/categories', [CategoryController::class, 'store'])
            ->name('categories.store');

        Route::put('/categories/{category}', [CategoryController::class, 'update'])
            ->name('categories.update');

        Route::patch('/categories/{category}/status', [CategoryController::class, 'updateStatus'])
            ->name('categories.update-status');

        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
            ->name('categories.destroy');

        Route::patch('/units/{unit}/status', [UnitController::class, 'updateStatus'])
            ->name('units.update-status');

        Route::resource('units', UnitController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::patch('suppliers/{supplier}/status', [SupplierController::class, 'updateStatus'])
            ->name('suppliers.update-status');

        Route::resource('suppliers', SupplierController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::patch('warehouses/{warehouse}/status', [WarehouseController::class, 'updateStatus'])
            ->name('warehouses.update-status');

        Route::resource('warehouses', WarehouseController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::patch('customers/{customer}/status', [CustomerController::class, 'updateStatus'])
            ->name('customers.update-status');

        Route::resource('customers', CustomerController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::patch('products/{product}/status', [ProductController::class, 'updateStatus'])
            ->name('products.update-status');

        Route::resource('products', ProductController::class)
            ->only(['index', 'store', 'update', 'destroy']);
    });

    Route::get('/inventory', [InventoryController::class, 'index'])
        ->name('inventory.index');

    Route::post('/inventory', [InventoryController::class, 'store'])
        ->name('inventory.store');

    Route::get('/inventory/overview', [StockOverviewController::class, 'index'])
        ->name('inventory.overview');

    Route::prefix('inventory/opname')
        ->name('inventory.opname.')
        ->group(function () {
            Route::get('/', [StockOpnameController::class, 'index'])
                ->name('index');

            Route::post('/', [StockOpnameController::class, 'store'])
                ->name('store');

            Route::get('/{opname}', [StockOpnameController::class, 'show'])
                ->name('show');

            Route::put('/{opname}', [StockOpnameController::class, 'update'])
                ->name('update');

            Route::post('/{opname}/post', [StockOpnameController::class, 'post'])
                ->name('post');
        });

    Route::get('/inventory/movements', [StockMovementController::class, 'index'])
        ->name('inventory.movements.index');

    Route::get('/inventory/stock-in/create', [StockInController::class, 'create'])
        ->name('inventory.stock-in.create');

    Route::post('/inventory/stock-in', [StockInController::class, 'store'])
        ->name('inventory.stock-in.store');

    Route::get('/inventory/stock-out/create', [
        StockOutController::class,
        'create',
    ])->name('inventory.stock-out.create');

    Route::post('/inventory/stock-out', [
        StockOutController::class,
        'store',
    ])->name('inventory.stock-out.store');

    Route::get(
        '/inventory/movements/{movement}',
        [StockMovementDetailController::class, 'show']
    )->name('inventory.movements.show');

    Route::post('/logout', [
        AuthenticatedSessionController::class,
        'destroy',
    ])->name('logout');
});
