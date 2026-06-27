<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\ExclusionPagoBaseModel;

class ExclusionesController extends BaseController
{
    public function index()
    {
        $model = new ExclusionPagoBaseModel();
        $includeInactive = $this->request->getGet('include_inactive') === '1';

        $query = $model->orderBy('tipo_match')->orderBy('valor');
        if (!$includeInactive) {
            $query->where('is_active', 1);
        }

        $rows = $query->findAll();

        return $this->response->setJSON([
            'total' => count($rows),
            'data'  => $rows,
        ]);
    }

    public function create()
    {
        $payload    = $this->request->getJSON(true) ?? [];
        $valor      = strtoupper(trim((string) ($payload['valor'] ?? '')));
        $tipoMatch  = strtoupper(trim((string) ($payload['tipo_match'] ?? '')));

        if ($valor === '' || !in_array($tipoMatch, ['COORDENADA', 'RUTA'], true)) {
            return $this->response->setStatusCode(400)->setJSON([
                'detail' => 'valor y tipo_match (COORDENADA|RUTA) son requeridos',
            ]);
        }

        $model  = new ExclusionPagoBaseModel();
        $exists = $model->where('valor', $valor)->where('tipo_match', $tipoMatch)->first();
        if ($exists) {
            return $this->response->setStatusCode(409)->setJSON(['detail' => 'La exclusión ya existe']);
        }

        $id = $model->insert([
            'valor'      => $valor,
            'tipo_match' => $tipoMatch,
            'is_active'  => 1,
        ], true);

        return $this->response->setStatusCode(201)->setJSON($model->find($id));
    }

    public function update(int $id)
    {
        $model = new ExclusionPagoBaseModel();
        $row   = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Exclusión no encontrada']);
        }

        $payload = $this->request->getJSON(true) ?? [];
        $data    = [];

        if (array_key_exists('valor', $payload)) {
            $valor = strtoupper(trim((string) $payload['valor']));
            if ($valor === '') {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'valor inválido']);
            }
            $data['valor'] = $valor;
        }

        if (array_key_exists('tipo_match', $payload)) {
            $tipo = strtoupper(trim((string) $payload['tipo_match']));
            if (!in_array($tipo, ['COORDENADA', 'RUTA'], true)) {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'tipo_match debe ser COORDENADA o RUTA']);
            }
            $data['tipo_match'] = $tipo;
        }

        if (array_key_exists('is_active', $payload)) {
            $data['is_active'] = (int) ($payload['is_active'] ? 1 : 0);
        }

        if ($data === []) {
            return $this->response->setJSON($row);
        }

        $model->update($id, $data);

        return $this->response->setJSON($model->find($id));
    }

    public function delete(int $id)
    {
        $model = new ExclusionPagoBaseModel();
        $row   = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Exclusión no encontrada']);
        }

        $model->delete($id, true);

        return $this->response->setJSON(['ok' => true, 'id' => $id]);
    }
}
