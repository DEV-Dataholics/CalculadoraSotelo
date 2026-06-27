<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\UnidadModel;

class UnidadesController extends BaseController
{
    public function index()
    {
        $model = new UnidadModel();
        $includeInactive = $this->request->getGet('include_inactive') === '1';

        $query = $model->orderBy('id', 'DESC');
        if (!$includeInactive) {
            $query->where('is_active', 1);
        }

        $rows = $query->findAll();

        return $this->response->setJSON([
            'total' => count($rows),
            'data' => $rows,
        ]);
    }

    public function show(int $id)
    {
        $model = new UnidadModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Unidad no encontrada']);
        }

        return $this->response->setJSON($row);
    }

    public function create()
    {
        $payload = $this->request->getJSON(true) ?? [];
        $tractor = strtoupper(trim((string) ($payload['tractor'] ?? '')));
        $yield = (float) ($payload['yield_km_l'] ?? 0);

        if ($tractor === '' || $yield <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'tractor y yield_km_l son requeridos']);
        }

        $model = new UnidadModel();

        $exists = $model->where('tractor', $tractor)->first();
        if ($exists) {
            return $this->response->setStatusCode(409)->setJSON(['detail' => 'El tractor ya existe']);
        }

        $id = $model->insert([
            'tractor' => $tractor,
            'yield_km_l' => $yield,
            'is_active' => (int) (($payload['is_active'] ?? 1) ? 1 : 0),
        ], true);

        return $this->response->setStatusCode(201)->setJSON($model->find($id));
    }

    public function update(int $id)
    {
        $model = new UnidadModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Unidad no encontrada']);
        }

        $payload = $this->request->getJSON(true) ?? [];
        $data = [];

        if (array_key_exists('tractor', $payload)) {
            $tractor = strtoupper(trim((string) $payload['tractor']));
            if ($tractor === '') {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'tractor invalido']);
            }

            $exists = $model->where('tractor', $tractor)->where('id !=', $id)->first();
            if ($exists) {
                return $this->response->setStatusCode(409)->setJSON(['detail' => 'El tractor ya existe']);
            }

            $data['tractor'] = $tractor;
        }

        if (array_key_exists('yield_km_l', $payload)) {
            $yield = (float) $payload['yield_km_l'];
            if ($yield <= 0) {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'yield_km_l debe ser mayor a 0']);
            }
            $data['yield_km_l'] = $yield;
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
        $model = new UnidadModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Unidad no encontrada']);
        }

        $model->delete($id, true);

        return $this->response->setJSON(['ok' => true, 'id' => $id]);
    }
}
