<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\TabuladorModel;

class TabuladorAdminController extends BaseController
{
    public function index()
    {
        $model = new TabuladorModel();
        $includeInactive = $this->request->getGet('include_inactive') === '1';
        $version = (int) ($this->request->getGet('version') ?? 0);
        $tipo = strtoupper(trim((string) ($this->request->getGet('tipo') ?? '')));

        $query = $model->orderBy('id', 'DESC');

        if (!$includeInactive) {
            $query->where('is_active', 1);
        }
        if ($version > 0) {
            $query->where('version', $version);
        }
        if ($tipo !== '') {
            $query->where('tipo', $tipo);
        }

        $rows = $query->findAll();

        return $this->response->setJSON([
            'total' => count($rows),
            'data' => $rows,
        ]);
    }

    public function show(int $id)
    {
        $model = new TabuladorModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Registro tabulador no encontrado']);
        }

        return $this->response->setJSON($row);
    }

    public function create()
    {
        $payload = $this->request->getJSON(true) ?? [];
        $tipo = strtoupper(trim((string) ($payload['tipo'] ?? '')));
        $pago = (float) ($payload['pago_operador'] ?? 0);

        if ($tipo === '' || $pago < 0) {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'tipo es requerido y pago_operador no puede ser negativo']);
        }

        $model = new TabuladorModel();

        $id = $model->insert([
            'tipo' => $tipo,
            'cruce' => $this->normalizeNullableUpper($payload['cruce'] ?? null),
            'origen' => $this->normalizeNullableUpper($payload['origen'] ?? null),
            'destino' => $this->normalizeNullableUpper($payload['destino'] ?? null),
            'pago_operador' => $pago,
            'version' => (int) ($payload['version'] ?? 1),
            'is_active' => (int) (($payload['is_active'] ?? 1) ? 1 : 0),
            'prioridad' => (int) ($payload['prioridad'] ?? 0),
        ], true);

        return $this->response->setStatusCode(201)->setJSON($model->find($id));
    }

    public function update(int $id)
    {
        $model = new TabuladorModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Registro tabulador no encontrado']);
        }

        $payload = $this->request->getJSON(true) ?? [];
        $data = [];

        if (array_key_exists('tipo', $payload)) {
            $tipo = strtoupper(trim((string) $payload['tipo']));
            if ($tipo === '') {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'tipo invalido']);
            }
            $data['tipo'] = $tipo;
        }
        if (array_key_exists('cruce', $payload)) {
            $data['cruce'] = $this->normalizeNullableUpper($payload['cruce']);
        }
        if (array_key_exists('origen', $payload)) {
            $data['origen'] = $this->normalizeNullableUpper($payload['origen']);
        }
        if (array_key_exists('destino', $payload)) {
            $data['destino'] = $this->normalizeNullableUpper($payload['destino']);
        }
        if (array_key_exists('pago_operador', $payload)) {
            $pago = (float) $payload['pago_operador'];
            if ($pago < 0) {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'pago_operador no puede ser negativo']);
            }
            $data['pago_operador'] = $pago;
        }
        if (array_key_exists('version', $payload)) {
            $data['version'] = (int) $payload['version'];
        }
        if (array_key_exists('is_active', $payload)) {
            $data['is_active'] = (int) ($payload['is_active'] ? 1 : 0);
        }
        if (array_key_exists('prioridad', $payload)) {
            $data['prioridad'] = (int) $payload['prioridad'];
        }

        if ($data === []) {
            return $this->response->setJSON($row);
        }

        $model->update($id, $data);

        return $this->response->setJSON($model->find($id));
    }

    public function delete(int $id)
    {
        $model = new TabuladorModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Registro tabulador no encontrado']);
        }

        $model->delete($id, true);

        return $this->response->setJSON(['ok' => true, 'id' => $id]);
    }

    private function normalizeNullableUpper($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = strtoupper(trim((string) $value));
        return $text === '' ? null : $text;
    }
}
