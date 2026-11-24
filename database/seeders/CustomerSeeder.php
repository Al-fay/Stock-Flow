<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            ['CUS001', 'Toko Sinar Jaya', 'customer1@example.com', '081300000001', 'Jakarta'],
            ['CUS002', 'CV Makmur Sentosa', 'customer2@example.com', '081300000002', 'Semarang'],
            ['CUS003', 'PT Cahaya Abadi', 'customer3@example.com', '081300000003', 'Surabaya'],
            ['CUS004', 'Toko Berkah', 'customer4@example.com', '081300000004', 'Bandung'],
            ['CUS005', 'UD Maju Bersama', 'customer5@example.com', '081300000005', 'Yogyakarta'],
            ['CUS006', 'Toko Elektronik Jaya', 'customer6@example.com', '081300000006', 'Solo'],
            ['CUS007', 'PT Mitra Niaga', 'customer7@example.com', '081300000007', 'Malang'],
            ['CUS008', 'CV Sumber Rezeki', 'customer8@example.com', '081300000008', 'Bekasi'],
            ['CUS009', 'Toko Sejahtera', 'customer9@example.com', '081300000009', 'Pemalang'],
            ['CUS010', 'UD Lancar Abadi', 'customer10@example.com', '081300000010', 'Tegal'],
        ];

        foreach ($customers as $item) {
            Customer::updateOrCreate(
                ['code' => $item[0]],
                [
                    'name' => $item[1],
                    'email' => $item[2],
                    'phone' => $item[3],
                    'address' => $item[4],
                    'notes' => 'Customer retail dan grosir.',
                    'is_active' => true,
                ]
            );
        }
    }
}
