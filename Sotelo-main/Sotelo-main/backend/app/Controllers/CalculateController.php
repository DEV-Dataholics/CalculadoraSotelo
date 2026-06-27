<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Libraries\PayrollCalculator;
use App\Models\AuditLogModel;

class CalculateController extends BaseController
{
    public function recalculate()
    {
        try {
            $data = $this->request->getJSON(true);
            if (!$data || !isset($data['trips']) || !is_array($data['trips'])) {
                return $this->response->setStatusCode(400)->setJSON([
                    'detail' => 'Request body invalido. Se esperaba {trips: [...]}',
                ]);
            }

            $calculator = new PayrollCalculator();
            $updated = [];
            foreach ($data['trips'] as $trip) {
                if (!is_array($trip)) {
                    continue;
                }
                $updated[] = $calculator->calculate($trip);
            }

            $audit = new AuditLogModel();
            $audit->insert([
                'action' => 'CALCULATE_EXECUTED',
                'entity_type' => 'calculate',
                'details' => json_encode(['trips' => count($updated)], JSON_UNESCAPED_UNICODE),
                'ip_address' => $this->request->getIPAddress(),
                'created_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->response->setJSON(['trips' => $updated]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['detail' => $e->getMessage()]);
        }
    }
}
