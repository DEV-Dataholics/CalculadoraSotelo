<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class RolePermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Matriz RBAC: qué permisos tiene cada rol
        $matrix = [
            'admin' => [
                'auth.login',
                'liquidacion.upload',
                'liquidacion.calculate',
                'liquidacion.view',
                'liquidacion.edit',
                'liquidacion.approve',
                'liquidacion.reject',
                'liquidacion.close',
                'catalog.view',
                'catalog.manage',
                'user.manage',
                'role.manage',
                'audit.view',
            ],
            'supervisor' => [
                'auth.login',
                'liquidacion.calculate',
                'liquidacion.view',
                'liquidacion.edit',
                'liquidacion.approve',
                'liquidacion.reject',
                'liquidacion.close',
                'catalog.view',
                'audit.view',
            ],
            'auditor' => [
                'auth.login',
                'liquidacion.view',
                'catalog.view',
                'audit.view',
            ],
            'operador' => [
                'auth.login',
                'liquidacion.view.own',
            ],
        ];

        $roles       = $this->db->table('roles')->get()->getResultArray();
        $permissions = $this->db->table('permissions')->get()->getResultArray();

        $roleMap = array_column($roles, 'id', 'name');
        $permMap = array_column($permissions, 'id', 'name');

        foreach ($matrix as $roleName => $permNames) {
            $roleId = $roleMap[$roleName] ?? null;
            if (!$roleId) {
                continue;
            }
            foreach ($permNames as $permName) {
                $permId = $permMap[$permName] ?? null;
                if (!$permId) {
                    continue;
                }
                $exists = $this->db->table('role_permissions')
                    ->where('role_id', $roleId)
                    ->where('permission_id', $permId)
                    ->countAllResults();
                if (!$exists) {
                    $this->db->table('role_permissions')->insert([
                        'role_id'       => $roleId,
                        'permission_id' => $permId,
                    ]);
                }
            }
        }
    }
}
