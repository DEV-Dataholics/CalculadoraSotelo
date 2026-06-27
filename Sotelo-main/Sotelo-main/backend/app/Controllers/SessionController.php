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
        $token = (string) ($data['token'] ?? '');
        $trips = $data['trips'] ?? null;

        if ($token === '' || !is_array($trips)) {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'token y trips son requeridos']);
        }

        $model = new LiquidacionModel();
        $model->insert([
            'session_token' => $token,
            'datos_boleta_json' => json_encode($trips, JSON_UNESCAPED_UNICODE),
            'status' => 'PENDING',
            'semana_nomina' => isset($data['semana_nomina']) ? (int) $data['semana_nomina'] : null,
        ]);

        return $this->response->setJSON(['ok' => true]);
    }

    public function restore()
    {
        $data = $this->request->getJSON(true) ?? [];
        $token = (string) ($data['token'] ?? '');
        if ($token === '') {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'token es requerido']);
        }

        $model = new LiquidacionModel();
        $session = $model->where('session_token', $token)
            ->where('status', 'PENDING')
            ->orderBy('id', 'DESC')
            ->first();

        if (!$session) {
            return $this->response->setJSON(['restored' => false]);
        }

        $model->update((int) $session['id'], ['status' => 'RESTORED']);
        return $this->response->setJSON(['restored' => true]);
    }
}
