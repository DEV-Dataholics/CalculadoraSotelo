<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\RutaModel;

class RutasController extends BaseController
{
    public function index()
    {
        $model = new RutaModel();
        $includeInactive = $this->request->getGet('include_inactive') === '1';
        $region = strtoupper(trim((string) ($this->request->getGet('region') ?? '')));

        $query = $model->orderBy('id', 'DESC');

        if (!$includeInactive) {
            $query->where('is_active', 1);
        }
        if ($region !== '') {
            $query->where('region', $region);
        }

        $rows = $query->findAll();

        return $this->response->setJSON([
            'total' => count($rows),
            'data' => $rows,
        ]);
    }

    public function show(int $id)
    {
        $model = new RutaModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Ruta no encontrada']);
        }

        return $this->response->setJSON($row);
    }

    public function create()
    {
        $payload = $this->request->getJSON(true) ?? [];
        $origin = strtoupper(trim((string) ($payload['origen_normalizado'] ?? '')));
        $destination = strtoupper(trim((string) ($payload['destino_normalizado'] ?? '')));
        $region = strtoupper(trim((string) ($payload['region'] ?? 'GENERAL')));
        $kms = (float) ($payload['distancia_km'] ?? 0);

        if ($origin === '' || $destination === '' || $kms <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'origen_normalizado, destino_normalizado y distancia_km son requeridos']);
        }

        if (!in_array($region, ['GENERAL', 'PACIFICO', 'CLIENTE'], true)) {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'region invalida']);
        }

        $model = new RutaModel();
        $id = $model->insert([
            'origen_normalizado' => $origin,
            'destino_normalizado' => $destination,
            'distancia_km' => $kms,
            'region' => $region,
            'is_active' => (int) (($payload['is_active'] ?? 1) ? 1 : 0),
        ], true);

        return $this->response->setStatusCode(201)->setJSON($model->find($id));
    }

    public function update(int $id)
    {
        $model = new RutaModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Ruta no encontrada']);
        }

        $payload = $this->request->getJSON(true) ?? [];
        $data = [];

        if (array_key_exists('origen_normalizado', $payload)) {
            $origin = strtoupper(trim((string) $payload['origen_normalizado']));
            if ($origin === '') {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'origen_normalizado invalido']);
            }
            $data['origen_normalizado'] = $origin;
        }

        if (array_key_exists('destino_normalizado', $payload)) {
            $destination = strtoupper(trim((string) $payload['destino_normalizado']));
            if ($destination === '') {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'destino_normalizado invalido']);
            }
            $data['destino_normalizado'] = $destination;
        }

        if (array_key_exists('distancia_km', $payload)) {
            $kms = (float) $payload['distancia_km'];
            if ($kms <= 0) {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'distancia_km debe ser mayor a 0']);
            }
            $data['distancia_km'] = $kms;
        }

        if (array_key_exists('region', $payload)) {
            $region = strtoupper(trim((string) $payload['region']));
            if (!in_array($region, ['GENERAL', 'PACIFICO', 'CLIENTE'], true)) {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'region invalida']);
            }
            $data['region'] = $region;
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
        $model = new RutaModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Ruta no encontrada']);
        }

        $model->delete($id, true);

        return $this->response->setJSON(['ok' => true, 'id' => $id]);
    }
}
