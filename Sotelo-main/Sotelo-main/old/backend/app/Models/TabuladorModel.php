<?php

namespace App\Models;

use CodeIgniter\Model;

class TabuladorModel extends Model
{
    protected $table            = 'tabulador_tarifas';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['tipo', 'cruce', 'origen', 'destino', 'pago_operador', 'version', 'is_active', 'prioridad'];

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

    /**
     * Resuelve la tarifa aplicable para un movimiento, de más específico a menos específico.
     *
     * Nivel 1: tipo + cruce + origen + destino (match exacto)
     * Nivel 2: tipo + cruce (cualquier origen/destino)
     * Nivel 3: tipo sólo, sin cruce (movimientos locales LOC/MDC/PTT)
     * Nivel 4: sin coincidencia → retorna null
     *
     * Si la tabla está vacía (tabulador no cargado), retorna null silenciosamente
     * para mantener backward compatibility con el cálculo legacy.
     *
     * @param string      $tipo    Código de tipo de movimiento (ej. "TRI-02")
     * @param string|null $cruce   Nombre del puente/cruce o null si es local
     * @param string|null $origen  Origen normalizado o null
     * @param string|null $destino Destino normalizado o null
     * @return array|null  Registro de tarifa o null si no hay match
     */
    public function getTarifa(string $tipo, ?string $cruce, ?string $origen, ?string $destino): ?array
    {
        $tipo    = strtoupper(trim($tipo));
        $cruce   = $cruce   !== null ? strtoupper(trim($cruce))   : null;
        $origen  = $origen  !== null ? strtoupper(trim($origen))  : null;
        $destino = $destino !== null ? strtoupper(trim($destino)) : null;

        // Verificar si hay registros activos — si no, salir sin error
        $count = $this->where('is_active', 1)->countAllResults(false);
        if ($count === 0) {
            return null;
        }

        // Nivel 1 — coincidencia exacta: tipo + cruce + origen + destino
        if ($cruce !== null && $origen !== null && $destino !== null) {
            $row = $this->where('tipo', $tipo)
                        ->where('cruce', $cruce)
                        ->where('origen', $origen)
                        ->where('destino', $destino)
                        ->where('is_active', 1)
                        ->orderBy('prioridad', 'DESC')
                        ->first();
            if ($row) {
                $row['nivel_match'] = 1;
                $row['regla']       = 'tipo+cruce+origen+destino';
                return $row;
            }
        }

        // Nivel 2 — tipo + cruce (origen/destino genérico: NULL en BD o match exacto)
        if ($cruce !== null) {
            $row = $this->where('tipo', $tipo)
                        ->where('cruce', $cruce)
                        ->groupStart()
                            ->where('origen', null)
                            ->orWhere('origen', $origen)
                        ->groupEnd()
                        ->groupStart()
                            ->where('destino', null)
                            ->orWhere('destino', $destino)
                        ->groupEnd()
                        ->where('is_active', 1)
                        ->orderBy('prioridad', 'DESC')
                        ->first();
            if ($row) {
                $row['nivel_match'] = 2;
                $row['regla']       = 'tipo+cruce';
                return $row;
            }
        }

        // Nivel 3 — tipo solo, sin cruce (movimientos locales)
        $row = $this->where('tipo', $tipo)
                    ->where('cruce', null)
                    ->where('is_active', 1)
                    ->orderBy('prioridad', 'DESC')
                    ->first();
        if ($row) {
            $row['nivel_match'] = 3;
            $row['regla']       = 'tipo_solo';
            return $row;
        }

        // Nivel 4 — sin coincidencia
        return null;
    }
}
