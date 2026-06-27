<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class PermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'auth.login',                   'description' => 'Iniciar sesión'],
            ['name' => 'liquidacion.upload',           'description' => 'Cargar CSV de Genesis'],
            ['name' => 'liquidacion.calculate',        'description' => 'Recalcular boleta'],
            ['name' => 'liquidacion.view',             'description' => 'Ver todas las liquidaciones'],
            ['name' => 'liquidacion.view.own',         'description' => 'Ver solo los viajes propios (operador)'],
            ['name' => 'liquidacion.edit',             'description' => 'Editar liquidaciones en estado BORRADOR'],
            ['name' => 'liquidacion.approve',          'description' => 'Aprobar liquidaciones'],
            ['name' => 'liquidacion.reject',           'description' => 'Rechazar liquidaciones'],
            ['name' => 'liquidacion.close',            'description' => 'Cerrar liquidaciones aprobadas'],
            ['name' => 'catalog.view',                 'description' => 'Ver catálogos (tabulador, rutas, keywords)'],
            ['name' => 'catalog.manage',               'description' => 'Crear/editar/eliminar entradas de catálogos'],
            ['name' => 'user.manage',                  'description' => 'Gestionar usuarios'],
            ['name' => 'role.manage',                  'description' => 'Gestionar roles y permisos'],
            ['name' => 'audit.view',                   'description' => 'Ver bitácora de auditoría'],
        ];

        foreach ($permissions as $perm) {
            if (!$this->db->table('permissions')->where('name', $perm['name'])->countAllResults()) {
                $this->db->table('permissions')->insert($perm);
            }
        }
    }
}
