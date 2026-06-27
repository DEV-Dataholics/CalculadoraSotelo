<?php

namespace App\Libraries;

use App\Models\RutaModel;

class RouteResolver
{
    /** @var array<string, float> */
    private array $clientRoutes = [];

    /** @var array<string, float> */
    private array $generalRoutes = [];

    /** @var array<string, float> */
    private array $pacificoRoutes = [];

    public function __construct()
    {
        $rutaModel = new RutaModel();
        $routes = $rutaModel->where('is_active', 1)->findAll();

        foreach ($routes as $row) {
            $key = strtoupper(trim($row['origen_normalizado'])) . '|' . strtoupper(trim($row['destino_normalizado']));
            $val = (float) $row['distancia_km'];
            $region = strtoupper((string) $row['region']);

            if ($region === 'CLIENTE') {
                $this->clientRoutes[$key] = $val;
            } elseif ($region === 'PACIFICO') {
                $this->pacificoRoutes[$key] = $val;
            } else {
                $this->generalRoutes[$key] = $val;
            }
        }
    }

    public function resolve(string $origin, string $dest, float $rowKms = 0): float
    {
        return $this->resolveWithSource($origin, $dest, $rowKms)['km'];
    }

    /**
     * Resuelve la distancia y retorna además la fuente del dato.
     * B-04: Permite detectar si se usó el tabulador maestro (TABULADO)
     * o el km del CSV/odómetro del conductor (FALLBACK).
     *
     * @return array{km: float, source: 'TABULADO'|'FALLBACK'}
     */
    public function resolveWithSource(string $origin, string $dest, float $rowKms = 0): array
    {
        $orgUp = strtoupper(trim($origin));
        $destUp = strtoupper(trim($dest));
        $key = $orgUp . '|' . $destUp;

        if (isset($this->clientRoutes[$key])) {
            return ['km' => $this->clientRoutes[$key], 'source' => 'TABULADO'];
        }

        $orgNorm = $this->normalizeMain($orgUp);
        $destNorm = $this->normalizeMain($destUp);
        $keyNorm = $orgNorm . '|' . $destNorm;

        if (isset($this->generalRoutes[$keyNorm])) {
            return ['km' => $this->generalRoutes[$keyNorm], 'source' => 'TABULADO'];
        }

        $pacOrg = (strpos($orgNorm, 'OBR') !== false) ? 'OBREGON' : $orgNorm;
        $pacDest = (strpos($destNorm, 'OBR') !== false) ? 'OBREGON' : $destNorm;
        $keyPac = $pacOrg . '|' . $pacDest;
        if (isset($this->pacificoRoutes[$keyPac])) {
            return ['km' => $this->pacificoRoutes[$keyPac], 'source' => 'TABULADO'];
        }

        // Fallback al odómetro del CSV — el operador debe revisar manualmente.
        $km = $rowKms > 0 ? $rowKms : 0.0;
        return ['km' => $km, 'source' => 'FALLBACK'];
    }

    private function normalizeMain(string $loc): string
    {
        $norm = $loc;
        if (strpos($loc, 'JRZ') !== false || strpos($loc, 'JUAREZ') !== false || strpos($loc, 'BASE') !== false) {
            $norm = 'JUAREZ';
        }
        if (strpos($loc, 'EL PASO') !== false || strpos($loc, 'RIO BRAVO') !== false) {
            $norm = 'EL PASO';
        }
        // D-07 fix: ZARAGOZA es el Puente Internacional Zaragoza-Ysleta, mismo corredor ELP
        // Coherente con BoletaProcessor.php que ya detecta ZARAGOZA como cruce ELP.
        if (strpos($loc, 'ZARAGOZA') !== false) {
            $norm = 'EL PASO';
        }
        if (strpos($loc, 'CHIH') !== false) {
            $norm = 'CHIHUAHUA';
        }

        return $norm;
    }
}
