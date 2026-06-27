<?php

namespace App\Models;

use CodeIgniter\Model;

class ExclusionPagoBaseModel extends Model
{
    protected $table         = 'exclusiones_pago_base';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = ['valor', 'tipo_match', 'is_active'];
    protected $useTimestamps = true;

    /** @return array<int, array<string, mixed>> */
    public function getActiveExclusions(): array
    {
        return $this->where('is_active', 1)->findAll();
    }
}
