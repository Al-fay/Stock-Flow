<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = [
            ['SUP001', 'PT Sumber Makmur', 'supplier1@example.com', '081234567801', 'Jakarta', 'Budi Santoso'],
            ['SUP002', 'CV Mitra Sejahtera', 'supplier2@example.com', '081234567802', 'Semarang', 'Andi Wijaya'],
            ['SUP003', 'PT Global Elektronik', 'supplier3@example.com', '081234567803', 'Surabaya', 'Rudi Hartono'],
            ['SUP004', 'CV Berkah Abadi', 'supplier4@example.com', '081234567804', 'Bandung', 'Siti Aminah'],
            ['SUP005', 'PT Indo Distribusi', 'supplier5@example.com', '081234567805', 'Yogyakarta', 'Dewi Lestari'],
            ['SUP006', 'CV Jaya Teknik', 'supplier6@example.com', '081234567806', 'Solo', 'Agus Setiawan'],
            ['SUP007', 'PT Nusantara Supply', 'supplier7@example.com', '081234567807', 'Tangerang', 'Fajar Nugraha'],
            ['SUP008', 'CV Prima Niaga', 'supplier8@example.com', '081234567808', 'Bekasi', 'Rina Marlina'],
            ['SUP009', 'PT Mega Persada', 'supplier9@example.com', '081234567809', 'Malang', 'Dimas Pratama'],
            ['SUP010', 'CV Sentosa Mandiri', 'supplier10@example.com', '081234567810', 'Pemalang', 'Eko Saputra'],
        ];

        foreach ($suppliers as $item) {
            Supplier::updateOrCreate(
                ['code' => $item[0]],
                [
                    'name' => $item[1],
                    'email' => $item[2],
                    'phone' => $item[3],
                    'address' => $item[4],
                    'contact_person' => $item[5],
                    'notes' => 'Supplier aktif untuk kebutuhan operasional.',
                    'is_active' => true,
                ]
            );
        }
    }
}
