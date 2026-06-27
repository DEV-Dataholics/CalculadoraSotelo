<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\LiquidacionModel;

class SessionController extends BaseController
{
    public function pending()
    {
        $token = (string) $this->request->getGet('token');
        if ($token === '') {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'token es requerido']);
        }

        $model = new LiquidacionModel();
        $session = $model->where('session_token', $token)
            ->where('status', 'PENDING')
            ->orderBy('id', 'DESC')
            ->first();

        return $this->response->setJSON(['session' => $session]);
    }

    public function save()
    {
        $data = $this->request->getJSON(true) ?? [];
        $trips = $data['trips'] ?? null;
        $start_date = $data['start_date'] ?? null;
        $end_date = $data['end_date'] ?? null;
        $total_general = $data['total_general'] ?? 0;

        if (!is_array($trips) || empty($trips)) {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'trips son requeridos']);
        }
        
        $userId = $this->request->user->id ?? 1; // get actual user from middleware if possible

        $model = new LiquidacionModel();
        $model->insert([
            'estado' => 'PENDIENTE',
            'start_date' => $start_date,
            'end_date' => $end_date,
            'total_general' => $total_general,
            'datos_json' => json_encode($trips, JSON_UNESCAPED_UNICODE),
            'created_by' => $userId,
        ]);

        return $this->response->setJSON(['ok' => true]);
    }

    public function summary()
    {
        $model = new LiquidacionModel();
        $builder = $model->builder();
        $builder->select('id, start_date, end_date, estado, total_general');
        $builder->orderBy('start_date', 'DESC');
        $results = $builder->get()->getResultArray();
        return $this->response->setJSON(['liquidaciones' => $results]);
    }

    public function get($id)
    {
        $model = new LiquidacionModel();
        $liquidacion = $model->find($id);
        if (!$liquidacion) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => 'No encontrado']);
        }
        return $this->response->setJSON($liquidacion);
    }
}
