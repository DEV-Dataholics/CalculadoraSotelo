<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\RutaModel;
use App\Models\UnidadModel;

class CatalogController extends BaseController
{
    public function rendimientos()
    {
        $unidadModel = new UnidadModel();
        return $this->response->setJSON([
            'rendimientos' => $unidadModel->getActiveYields(),
            'default_yield' => 2.37341,
        ]);
    }

    public function rutas()
    {
        $rutaModel = new RutaModel();

        $query = $rutaModel->where('is_active', 1);

        $region = $this->request->getGet('region');
        if (!empty($region)) {
            $query->where('region', strtoupper((string) $region));
        }

        $origen = $this->request->getGet('origen');
        if (!empty($origen)) {
            $query->where('origen_normalizado', strtoupper((string) $origen));
        }

        $destino = $this->request->getGet('destino');
        if (!empty($destino)) {
            $query->where('destino_normalizado', strtoupper((string) $destino));
        }

        $rows = $query->findAll();

        return $this->response->setJSON([
            'total' => count($rows),
            'rutas' => $rows,
        ]);
    }

    public function keywords()
    {
        $db = \Config\Database::connect();
        $rows = $db->table('pacifico_keywords')->select('keyword')->where('is_active', 1)->get()->getResultArray();

        return $this->response->setJSON([
            'keywords' => array_map(static fn($row) => $row['keyword'], $rows),
        ]);
    }
}
