<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\MasterData\CategoryController;
use App\Http\Middleware\JwtAuthenticate;

// Routes sebelum login
Route::middleware('guest')->group(function () {
    Route::get('/sign-in', function () {
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

// Routes setelah login
Route::middleware([JwtAuthenticate::class])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard/index');
    })->name('dashboard');

    Route::prefix('master-data')->name('master-data.')->group(function () {
        Route::get('/categories', [CategoryController::class, 'index'])
            ->name('categories.index');

        Route::post('/categories', [CategoryController::class, 'store'])
            ->name('categories.store');

        Route::put('/categories/{category}', [CategoryController::class, 'update'])
            ->name('categories.update');

        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
            ->name('categories.destroy');
    });

    Route::post('/logout', [
        AuthenticatedSessionController::class,
        'destroy',
    ])->name('logout');
});
