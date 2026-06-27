<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\PacificoKeywordModel;

class KeywordsController extends BaseController
{
    public function index()
    {
        $model = new PacificoKeywordModel();
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
        $model = new PacificoKeywordModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Keyword no encontrado']);
        }

        return $this->response->setJSON($row);
    }

    public function create()
    {
        $payload = $this->request->getJSON(true) ?? [];
        $keyword = strtoupper(trim((string) ($payload['keyword'] ?? '')));

        if ($keyword === '') {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'keyword es requerido']);
        }

        $model = new PacificoKeywordModel();
        $exists = $model->where('keyword', $keyword)->first();
        if ($exists) {
            return $this->response->setStatusCode(409)->setJSON(['detail' => 'keyword duplicado']);
        }

        $id = $model->insert([
            'keyword' => $keyword,
            'is_active' => (int) (($payload['is_active'] ?? 1) ? 1 : 0),
        ], true);

        return $this->response->setStatusCode(201)->setJSON($model->find($id));
    }

    public function update(int $id)
    {
        $model = new PacificoKeywordModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Keyword no encontrado']);
        }

        $payload = $this->request->getJSON(true) ?? [];
        $data = [];

        if (array_key_exists('keyword', $payload)) {
            $keyword = strtoupper(trim((string) $payload['keyword']));
            if ($keyword === '') {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'keyword invalido']);
            }

            $exists = $model->where('keyword', $keyword)->where('id !=', $id)->first();
            if ($exists) {
                return $this->response->setStatusCode(409)->setJSON(['detail' => 'keyword duplicado']);
            }
            $data['keyword'] = $keyword;
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
        $model = new PacificoKeywordModel();
        $row = $model->find($id);

        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'Keyword no encontrado']);
        }

        $model->delete($id, true);

        return $this->response->setJSON(['ok' => true, 'id' => $id]);
    }
}
