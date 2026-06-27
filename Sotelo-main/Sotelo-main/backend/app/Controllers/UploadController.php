<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Libraries\BoletaProcessor;
use App\Libraries\CsvParser;
use App\Libraries\PacificoDetector;
use App\Libraries\RouteResolver;
use App\Models\AuditLogModel;
use App\Models\UnidadModel;

class UploadController extends BaseController
{
    public function process()
    {
        ini_set('memory_limit', '512M');

        try {
            $file = $this->request->getFile('file');
            if (!$file || !$file->isValid()) {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'No se recibio ningun archivo.']);
            }

            $ext = strtolower((string) $file->getExtension());
            if (!in_array($ext, ['csv', 'xlsx', 'xls'], true)) {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'Tipo de archivo invalido. Sube un CSV o Excel de Genesis.']);
            }
            if ($ext !== 'csv') {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'Archivos Excel no estan soportados en esta version. Exporta a CSV.']);
            }

            $content = file_get_contents($file->getTempName());
            if ($content === false || $content === '') {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'Archivo CSV invalido o vacio.']);
            }

            $parser = new CsvParser();
            $parsed = $parser->parse($content);
            $headers = $parsed['headers'];
            $rows = $parsed['rows'];
            if (empty($rows)) {
                return $this->response->setStatusCode(400)->setJSON(['detail' => 'El archivo no contiene datos.']);
            }

            $byDriver = [];
            foreach ($rows as $row) {
                $driver = trim((string) ($row['Conductor'] ?? ''));
                if ($driver === '') {
                    continue;
                }
                $byDriver[$driver][] = $row;
            }

            $unidadModel = new UnidadModel();
            $boletaProcessor = new BoletaProcessor(
                $unidadModel->getActiveYields(),
                new RouteResolver(),
                new PacificoDetector()
            );

            $results = [];
            $hasBoleta = in_array('Boleta', $headers, true);
            foreach ($byDriver as $driver => $driverRows) {
                if ($hasBoleta) {
                    $entries = $boletaProcessor->processByBoleta($driverRows, $driver);
                } else {
                    $entries = $boletaProcessor->processByBoleta($driverRows, $driver);
                }
                $results = array_merge($results, $entries);
            }

            $minDate = null;
            $maxDate = null;
            $drivers = array_keys($byDriver);

            foreach ($results as $trip) {
                if (!empty($trip['Rows']) && is_array($trip['Rows'])) {
                    foreach ($trip['Rows'] as $row) {
                        $arr = $row['Arranque_Date'] ?? null;
                        $arrB = $row['Arribo_Date'] ?? null;
                        
                        if ($arr) {
                            $ts = strtotime($arr);
                            if ($ts !== false) {
                                if ($minDate === null || $ts < $minDate) $minDate = $ts;
                                if ($maxDate === null || $ts > $maxDate) $maxDate = $ts;
                            }
                        }
                        if ($arrB) {
                            $ts = strtotime($arrB);
                            if ($ts !== false) {
                                if ($minDate === null || $ts < $minDate) $minDate = $ts;
                                if ($maxDate === null || $ts > $maxDate) $maxDate = $ts;
                            }
                        }
                    }
                }
            }

            $warnings = [];
            if ($minDate !== null && $maxDate !== null) {
                $minDateStr = date('Y-m-d', $minDate);
                $maxDateStr = date('Y-m-d', $maxDate);

                $liqModel = new \App\Models\LiquidacionModel();
                $overlaps = $liqModel->where('estado !=', 'BORRADOR')
                    ->where('start_date <=', $maxDateStr)
                    ->where('end_date >=', $minDateStr)
                    ->findAll();

                foreach ($overlaps as $overlap) {
                    $json = $overlap['datos_json'];
                    $savedTrips = is_string($json) ? json_decode($json, true) : $json;
                    if (!is_array($savedTrips)) $savedTrips = [];
                    
                    $savedDrivers = [];
                    foreach ($savedTrips as $st) {
                        if (!empty($st['Driver_Name'])) {
                            $savedDrivers[$st['Driver_Name']] = true;
                        }
                    }
                    
                    foreach ($drivers as $d) {
                        if (isset($savedDrivers[$d])) {
                            $warnings[] = [
                                'driver' => $d,
                                'start_date' => $overlap['start_date'],
                                'end_date' => $overlap['end_date'],
                                'estado' => $overlap['estado']
                            ];
                        }
                    }
                }
                
                $uniqueWarnings = [];
                foreach ($warnings as $w) {
                    $key = $w['driver'] . '|' . $w['start_date'] . '|' . $w['end_date'];
                    $uniqueWarnings[$key] = $w;
                }
                $warnings = array_values($uniqueWarnings);
            }

            $audit = new AuditLogModel();
            $audit->insert([
                'action' => 'CSV_UPLOADED',
                'entity_type' => 'upload',
                'details' => json_encode(['filename' => $file->getName(), 'rows' => count($rows), 'trips' => count($results), 'warnings' => count($warnings)], JSON_UNESCAPED_UNICODE),
                'ip_address' => $this->request->getIPAddress(),
                'created_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->response->setJSON([
                'trips' => $results,
                'warnings' => $warnings
            ]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['detail' => $e->getMessage()]);
        }
    }
}
