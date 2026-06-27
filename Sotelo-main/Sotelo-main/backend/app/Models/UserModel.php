<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table      = 'users';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $allowedFields = [
        'email',
        'password_hash',
        'is_active',
        'unidad',
        'operador_ref',
        'last_login_at',
    ];

    protected $useTimestamps = true;

    public function findByEmail(string $email): ?array
    {
        return $this->where('email', $email)->first();
    }

    /**
     * Retorna el usuario con sus permisos aplanados como array de strings.
     */
    public function loadWithPermissions(int $userId): ?array
    {
        $user = $this->find($userId);
        if (!$user) {
            return null;
        }

        $permissions = $this->db->table('permissions p')
            ->select('p.name')
            ->join('role_permissions rp', 'rp.permission_id = p.id')
            ->join('user_roles ur', 'ur.role_id = rp.role_id')
            ->where('ur.user_id', $userId)
            ->get()
            ->getResultArray();

        $roles = $this->db->table('roles r')
            ->select('r.name')
            ->join('user_roles ur', 'ur.role_id = r.id')
            ->where('ur.user_id', $userId)
            ->get()
            ->getResultArray();

        $user['permissions'] = array_unique(array_column($permissions, 'name'));
        $user['roles']       = array_column($roles, 'name');
        unset($user['password_hash']);

        return $user;
    }

    public function touchLastLogin(int $userId): void
    {
        $this->db->table('users')
            ->where('id', $userId)
            ->update(['last_login_at' => date('Y-m-d H:i:s')]);
    }
}
