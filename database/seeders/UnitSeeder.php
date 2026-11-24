<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $units = [
            ['PCS', 'Pieces', 'pcs', 'Satuan per buah'],
            ['BOX', 'Box', 'box', 'Satuan per kotak'],
            ['KG', 'Kilogram', 'kg', 'Satuan berat'],
            ['LTR', 'Liter', 'ltr', 'Satuan volume'],
            ['SET', 'Set', 'set', 'Satuan per set'],
            ['BTL', 'Bottle', 'btl', 'Satuan per botol'],
            ['PKT', 'Pack', 'pkt', 'Satuan per kemasan'],
            ['ROLL', 'Roll', 'roll', 'Satuan per gulung'],
        ];

        foreach ($units as [$code, $name, $symbol, $description]) {
            Unit::updateOrCreate(
                ['code' => $code],
                compact('name', 'symbol', 'description') + [
                    'is_active' => true,
                ]
            );
        }
    }
}
