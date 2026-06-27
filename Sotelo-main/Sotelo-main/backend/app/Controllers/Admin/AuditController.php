<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\AuditLogModel;

class AuditController extends BaseController
{
    public function index()
    {
        $model = new AuditLogModel();

        $action = strtoupper(trim((string) ($this->request->getGet('action') ?? '')));
        $entityType = strtolower(trim((string) ($this->request->getGet('entity_type') ?? '')));
        $limit = max(1, min(500, (int) ($this->request->getGet('limit') ?? 100)));

        $query = $model->orderBy('id', 'DESC')->limit($limit);

        if ($action !== '') {
            $query->where('action', $action);
        }
        if ($entityType !== '') {
            $query->where('entity_type', $entityType);
        }

        $rows = $query->findAll();

        return $this->response->setJSON([
            'total' => count($rows),
            'data' => $rows,
        ]);
    }
}
