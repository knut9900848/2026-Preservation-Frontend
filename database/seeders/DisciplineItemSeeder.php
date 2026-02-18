<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DisciplineItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['discipline_id' => 2, 'code' => 'EP-01', 'name' => 'Electrical Motors (Ex)', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 2, 'code' => 'EP-02', 'name' => 'Alternators / Generators', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 2, 'code' => 'EP-03', 'name' => 'Duct Heater', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 2, 'code' => 'EP-04', 'name' => 'DB - Relay Boxes - SWBD - Panels - Cabinets', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 2, 'code' => 'EP-05', 'name' => 'Transformers - Neutral Earthing Resistors', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 2, 'code' => 'EP-06', 'name' => 'UPS, Battery Charger, Batteries Bank', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 2, 'code' => 'EP-07', 'name' => 'Telecom Devices / Computers / Electronic Equipment', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 2, 'code' => 'EP-08', 'name' => 'Junction Box', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 2, 'code' => 'EP-09', 'name' => 'Electrical Heaters', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 1, 'code' => 'AP-01', 'name' => 'Area Preservation Inspection', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 3, 'code' => 'IP-01', 'name' => 'Field transmitter, Analyzer,', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 3, 'code' => 'IP-02', 'name' => 'Fire and Gas Devices', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 3, 'code' => 'IP-03', 'name' => 'Actuated Valves', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-01', 'name' => 'Electrical motor driven pump', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-02', 'name' => 'Boiler (Not applicable for Barossa)', 'method' => 'N/A', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-03', 'name' => 'Gas / Steam Turbine Generators', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-04', 'name' => 'Diesel Engine Generator', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-05', 'name' => 'Cranes', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-06', 'name' => 'Fans', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-07', 'name' => 'Hydraulic Power Units', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-08', 'name' => 'Dampers', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-09', 'name' => 'HVAC', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-10', 'name' => 'Pressure Vessels, Separators, Atmospheric Tanks, Scrubber, Calorifier', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-11', 'name' => 'Heat Exchanger (Shell & Tube / Plate & Frame/ Air cooler / Spiral)', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 5, 'code' => 'DP-01', 'name' => 'Skid – Mechanical / Electrical / Instruments / Piping', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 5, 'code' => 'DP-02', 'name' => 'Gas Compressor Motor Driven', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 5, 'code' => 'DP-03', 'name' => 'Diesel Engine Pump', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 5, 'code' => 'DP-04', 'name' => 'Hydraulic powered Pump', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-12', 'name' => 'Air compressor & Dryer', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-13', 'name' => 'Tank Cleaning Machine', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 4, 'code' => 'MP-14', 'name' => 'Hydraulic Powered Centrifugal Pump', 'method' => 'Tag', 'is_active' => true],
            ['discipline_id' => 6, 'code' => 'TP-01', 'name' => 'Membrane / Filter Storage', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 7, 'code' => 'PP-01', 'name' => 'Piping', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 7, 'code' => 'PP-02', 'name' => 'Manual Valves', 'method' => 'bulk', 'is_active' => true],
            ['discipline_id' => 8, 'code' => 'SP-01', 'name' => 'Fixed Fighting Equipment', 'method' => 'Bulk', 'is_active' => true],
            ['discipline_id' => 8, 'code' => 'SP-02', 'name' => 'Lifeboat, Rescue boat, Life raft & Life raft station', 'method' => 'Tag', 'is_active' => true],
        ];

        $now = now();

        foreach ($items as $item) {
            DB::table('discipline_items')->insert(array_merge($item, [
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }
}
