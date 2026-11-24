<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            ['ELEC', 'PCS', 'PRD001', '899100000001', 'Wireless Mouse', 45000, 75000, 10],
            ['ELEC', 'PCS', 'PRD002', '899100000002', 'Mechanical Keyboard', 180000, 250000, 5],
            ['ELEC', 'PCS', 'PRD003', '899100000003', 'USB Flashdisk 32GB', 45000, 65000, 10],
            ['ELEC', 'PCS', 'PRD004', '899100000004', 'USB Hub 4 Port', 35000, 55000, 5],
            ['ELEC', 'PCS', 'PRD005', '899100000005', 'Headset Bluetooth', 95000, 145000, 5],

            ['FOOD', 'KG', 'PRD006', '899100000006', 'Beras Premium', 13000, 16000, 50],
            ['FOOD', 'KG', 'PRD007', '899100000007', 'Gula Pasir', 14000, 17000, 30],
            ['FOOD', 'LTR', 'PRD008', '899100000008', 'Minyak Goreng', 16000, 19000, 30],
            ['FOOD', 'BTL', 'PRD009', '899100000009', 'Sirup Marjan', 18000, 23000, 20],

            ['OFFC', 'PCS', 'PRD010', '899100000010', 'Pulpen Standard', 2000, 3500, 100],
            ['OFFC', 'PCS', 'PRD011', '899100000011', 'Buku Tulis', 3500, 5000, 50],
            ['OFFC', 'BOX', 'PRD012', '899100000012', 'Kertas A4', 45000, 55000, 10],
            ['OFFC', 'PCS', 'PRD013', '899100000013', 'Stapler', 15000, 22000, 10],

            ['HOME', 'PCS', 'PRD014', '899100000014', 'Ember Plastik', 18000, 25000, 10],
            ['HOME', 'PCS', 'PRD015', '899100000015', 'Sapu Lantai', 12000, 18000, 10],
            ['HOME', 'PCS', 'PRD016', '899100000016', 'Tempat Sampah', 25000, 35000, 5],

            ['TOOL', 'SET', 'PRD017', '899100000017', 'Obeng Set', 45000, 65000, 5],
            ['TOOL', 'PCS', 'PRD018', '899100000018', 'Tang Kombinasi', 30000, 45000, 5],
            ['TOOL', 'PCS', 'PRD019', '899100000019', 'Palu Besi', 25000, 38000, 5],

            ['CLTH', 'PCS', 'PRD020', '899100000020', 'Kaos Polos', 35000, 55000, 10],
            ['CLTH', 'PCS', 'PRD021', '899100000021', 'Kemeja Formal', 85000, 125000, 5],

            ['BEAU', 'BTL', 'PRD022', '899100000022', 'Shampoo 250ml', 18000, 25000, 10],
            ['BEAU', 'BTL', 'PRD023', '899100000023', 'Body Lotion', 22000, 32000, 10],

            ['AUTO', 'PCS', 'PRD024', '899100000024', 'Oli Mesin', 45000, 65000, 10],
            ['AUTO', 'PCS', 'PRD025', '899100000025', 'Busi Motor', 12000, 18000, 10],
        ];

        foreach ($products as $item) {
            $category = Category::where('code', $item[0])->firstOrFail();
            $unit = Unit::where('code', $item[1])->firstOrFail();

            Product::updateOrCreate(
                ['sku' => $item[2]],
                [
                    'category_id' => $category->id,
                    'unit_id' => $unit->id,
                    'barcode' => $item[3],
                    'name' => $item[4],
                    'description' => 'Produk ' . $item[4],
                    'purchase_price' => $item[5],
                    'selling_price' => $item[6],
                    'minimum_stock' => $item[7],
                    'is_active' => true,
                ]
            );
        }
    }
}
