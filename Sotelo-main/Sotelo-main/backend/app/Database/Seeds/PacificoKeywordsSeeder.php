<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class PacificoKeywordsSeeder extends Seeder
{
    public function run()
    {
        $keywords = [
            'OBRG',
            'OBREGON',
            'MOCHIS',
            'GUAMUCHIL',
            'NAVOJOA',
            'CANANEA',
            'ETCHO',
            'JANOS',
            'NOGALES',
            'S. RIO COL',
            'HERMOSILLO',
            'EMPALME',
            'BACUM',
            'GYSA',
            'YARDA SOTELO',
        ];

        $rows = array_map(static fn(string $kw) => ['keyword' => $kw, 'is_active' => 1], $keywords);
        $this->db->table('pacifico_keywords')->insertBatch($rows);
    }
}
