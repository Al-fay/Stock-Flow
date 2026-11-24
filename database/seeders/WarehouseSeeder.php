<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $warehouses = [
            [
                'WH001',
                'Main Warehouse',
                'Jakarta',
                'Jl. Industri No. 10, Jakarta',
                'Budi Santoso',
                '081234560001',
            ],
            [
                'WH002',
                'Central Warehouse',
                'Semarang',
                'Jl. Pemuda No. 25, Semarang',
                'Andi Wijaya',
                '081234560002',
            ],
            [
                'WH003',
                'East Warehouse',
                'Surabaya',
                'Jl. Rungkut Industri No. 15, Surabaya',
                'Rudi Hartono',
                '081234560003',
            ],
            [
                'WH004',
                'West Warehouse',
                'Bandung',
                'Jl. Soekarno Hatta No. 50, Bandung',
                'Siti Aminah',
                '081234560004',
            ],
        ];

        foreach ($warehouses as $item) {
            Warehouse::updateOrCreate(
                ['code' => $item[0]],
                [
                    'name' => $item[1],
                    'location' => $item[2],
                    'address' => $item[3],
                    'contact_person' => $item[4],
                    'phone' => $item[5],
                    'description' => 'Gudang penyimpanan dan distribusi barang.',
                    'is_active' => true,
                ]
            );
        }
    }
}
