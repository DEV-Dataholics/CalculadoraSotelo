<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class MainSeeder extends Seeder
{
    public function run(): void
    {
        $this->call('RolesSeeder');
        $this->call('PermissionsSeeder');
        $this->call('RolePermissionsSeeder');
        $this->call('AdminUserSeeder');

        // Seeders de catálogos existentes (idempotentes)
        $this->call('PacificoKeywordsSeeder');
        $this->call('RutasSeeder');
        $this->call('UnidadesSeeder');
    }
}
