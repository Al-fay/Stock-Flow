<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['ELEC', 'Elektronik', 'Produk elektronik dan aksesoris'],
            ['FOOD', 'Makanan', 'Produk makanan dan minuman'],
            ['OFFC', 'Perlengkapan Kantor', 'Alat tulis dan perlengkapan kantor'],
            ['HOME', 'Peralatan Rumah Tangga', 'Kebutuhan rumah tangga'],
            ['TOOL', 'Peralatan Teknik', 'Peralatan dan perkakas teknik'],
            ['CLTH', 'Pakaian', 'Produk pakaian dan tekstil'],
            ['BEAU', 'Kecantikan', 'Produk kecantikan dan perawatan'],
            ['AUTO', 'Otomotif', 'Sparepart dan aksesoris kendaraan'],
        ];

        foreach ($categories as [$code, $name, $description]) {
            Category::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'description' => $description,
                    'is_active' => true,
                ]
            );
        }
    }
}
