<?php

namespace App\Models;

use CodeIgniter\Model;

class RoleModel extends Model
{
    protected $table      = 'roles';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $allowedFields = ['name', 'description'];

    protected $useTimestamps = false;

    public function getPermissions(int $roleId): array
    {
        return $this->db->table('permissions p')
            ->select('p.name')
            ->join('role_permissions rp', 'rp.permission_id = p.id')
            ->where('rp.role_id', $roleId)
            ->get()
            ->getResultArray();
    }
}
