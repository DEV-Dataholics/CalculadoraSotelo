<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class ExclusionSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['valor' => 'TRI',           'tipo_match' => 'COORDENADA'],
            ['valor' => 'GT',            'tipo_match' => 'COORDENADA'],
            ['valor' => 'ZARAGOZA DTR',  'tipo_match' => 'RUTA'],
            ['valor' => 'FLETES SOTELO', 'tipo_match' => 'RUTA'],
        ];

        foreach ($rows as $row) {
            $this->db->table('exclusiones_pago_base')->ignore(true)->insert(
                array_merge($row, ['is_active' => 1])
            );
        }
    }
}
