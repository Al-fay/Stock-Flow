<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            CategorySeeder::class,
            UnitSeeder::class,
            SupplierSeeder::class,
            WarehouseSeeder::class,
            CustomerSeeder::class,
            ProductSeeder::class,

            StockInSeeder::class,
            StockOutSeeder::class,
            StockOpnameSeeder::class,
            StockReturnSeeder::class,

            StockMovementSeeder::class,
        ]);
    }
}
