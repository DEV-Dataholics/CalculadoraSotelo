<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\LiquidacionModel;

class LiquidacionesController extends BaseController
{
    public function index()
    {
        $model = new LiquidacionModel();

        $status = strtoupper(trim((string) ($this->request->getGet('status') ?? '')));
        $limit = max(1, min(500, (int) ($this->request->getGet('limit') ?? 100)));

        $query = $model->orderBy('id', 'DESC')->limit($limit);
        if ($status !== '') {
            $query->where('status', $status);
        }

        $rows = $query->findAll();

        return $this->response->setJSON([
            'total' => count($rows),
            'data' => $rows,
        ]);
    }

    public function show(int $id)
    {
        $model = new LiquidacionModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Liquidacion no encontrada']);
        }

        return $this->response->setJSON($row);
    }
}
