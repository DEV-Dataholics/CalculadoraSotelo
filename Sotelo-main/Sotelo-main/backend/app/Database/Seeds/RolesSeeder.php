<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin',      'description' => 'Administra y opera la nómina completa'],
            ['name' => 'operador',   'description' => 'Conductor — consulta solo sus propios viajes'],
            ['name' => 'supervisor', 'description' => 'Revisa, aprueba/rechaza y cierra liquidaciones'],
            ['name' => 'auditor',    'description' => 'Solo lectura global — no modifica nada'],
        ];

        foreach ($roles as $role) {
            if (!$this->db->table('roles')->where('name', $role['name'])->countAllResults()) {
                $this->db->table('roles')->insert($role);
            }
        }
    }
}
