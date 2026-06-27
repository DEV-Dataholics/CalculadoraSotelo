<?php

namespace App\Models;

use CodeIgniter\Model;

class UnidadModel extends Model
{
    protected $table            = 'unidades_rendimiento';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['tractor', 'yield_km_l', 'is_active'];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    protected array $casts = [];
    protected array $castHandlers = [];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = '';

    // Validation
    protected $validationRules      = [];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $allowCallbacks = true;
    protected $beforeInsert   = [];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    public function getActiveYields(): array
    {
        $rows = $this->select(['tractor', 'yield_km_l'])
            ->where('is_active', 1)
            ->findAll();

        $dict = [];
        foreach ($rows as $row) {
            $dict[$row['tractor']] = (float) $row['yield_km_l'];
        }

        return $dict;
    }
}
