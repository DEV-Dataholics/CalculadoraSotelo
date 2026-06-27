<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\TabuladorModel;

class TabuladorController extends BaseController
{
    public function consultar()
    {
        $tipo = strtoupper((string) $this->request->getGet('tipo'));
        if ($tipo === '') {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'tipo es requerido']);
        }

        $cruce   = strtoupper((string) $this->request->getGet('cruce'));
        $origen  = strtoupper((string) $this->request->getGet('origen'));
        $destino = strtoupper((string) $this->request->getGet('destino'));

        $model  = new TabuladorModel();
        $tarifa = $model->getTarifa(
            $tipo,
            $cruce  !== '' ? $cruce  : null,
            $origen !== '' ? $origen : null,
            $destino !== '' ? $destino : null
        );

        return $this->response->setJSON(['tarifa' => $tarifa]);
    }

    public function versiones()
    {
        $model = new TabuladorModel();
        $rows  = $model->select('version, COUNT(*) as total, MAX(is_active) as activa, MAX(created_at) as fecha_carga')
            ->groupBy('version')
            ->orderBy('version', 'DESC')
            ->findAll();

        return $this->response->setJSON(['versiones' => $rows]);
    }

    /**
     * Carga masiva de tarifas desde un archivo CSV.
     *
     * Espera multipart/form-data con campo "file" (CSV).
     * Columnas requeridas: tipo, cruce, origen, destino, pago_operador
     * Columnas opcionales: prioridad
     *
     * El archivo se valida primero; si pasa, se inserta como nueva versión (inactiva).
     * Para activarla, usar POST /api/tabulador/activar.
     *
     * Responde: { version, filas_ok, filas_rechazadas, errores[] }
     */
    public function upload()
    {
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response->setStatusCode(400)->setJSON([
                'detail' => 'Se requiere un archivo CSV válido en el campo "file".',
            ]);
        }

        $ext = strtolower($file->getClientExtension());
        if ($ext !== 'csv') {
            return $this->response->setStatusCode(400)->setJSON([
                'detail' => 'Solo se aceptan archivos .csv. Se recibió: .' . $ext,
            ]);
        }

        // ── Leer y parsear CSV ───────────────────────────────────────────────
        $handle = fopen($file->getTempName(), 'r');
        if ($handle === false) {
            return $this->response->setStatusCode(500)->setJSON(['detail' => 'No se pudo leer el archivo.']);
        }

        // Detectar BOM UTF-8 y eliminar
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        // Primera línea = encabezados
        $headers = fgetcsv($handle, 0, ',');
        if ($headers === false) {
            fclose($handle);
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'El CSV está vacío o no tiene encabezados.']);
        }

        // Normalizar nombres de columnas
        $headers = array_map(fn($h) => strtolower(trim((string) $h)), $headers);

        $required = ['tipo', 'pago_operador'];
        $missing  = array_diff($required, $headers);
        if (!empty($missing)) {
            fclose($handle);
            return $this->response->setStatusCode(400)->setJSON([
                'detail'  => 'Columnas requeridas faltantes en el CSV.',
                'faltantes' => array_values($missing),
                'encontradas' => $headers,
            ]);
        }

        // ── Calcular próxima versión ─────────────────────────────────────────
        $model      = new TabuladorModel();
        $maxVersion = $model->selectMax('version')->first()['version'] ?? 0;
        $newVersion = (int) $maxVersion + 1;

        // ── Procesar filas ───────────────────────────────────────────────────
        $filasOk        = 0;
        $filasRechazadas = 0;
        $errores        = [];
        $inserts        = [];
        $lineNum        = 1; // ya leímos header

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            $lineNum++;
            if (count($row) === 0 || (count($row) === 1 && trim($row[0]) === '')) {
                continue; // fila vacía
            }

            $record = array_combine($headers, array_pad($row, count($headers), ''));
            if ($record === false) {
                $errores[]        = "Línea {$lineNum}: número de columnas incorrecto.";
                $filasRechazadas++;
                continue;
            }

            $tipo = strtoupper(trim((string) ($record['tipo'] ?? '')));
            $pago = trim((string) ($record['pago_operador'] ?? ''));

            if ($tipo === '') {
                $errores[]        = "Línea {$lineNum}: 'tipo' vacío.";
                $filasRechazadas++;
                continue;
            }

            if (!is_numeric($pago) || (float) $pago < 0) {
                $errores[]        = "Línea {$lineNum}: 'pago_operador' inválido: '{$pago}'.";
                $filasRechazadas++;
                continue;
            }

            $cruce   = $this->normalizeNullable($record['cruce']   ?? null);
            $origen  = $this->normalizeNullable($record['origen']  ?? null);
            $destino = $this->normalizeNullable($record['destino'] ?? null);
            $prioridad = isset($record['prioridad']) && is_numeric($record['prioridad'])
                ? (int) $record['prioridad']
                : 0;

            $inserts[] = [
                'tipo'          => $tipo,
                'cruce'         => $cruce,
                'origen'        => $origen,
                'destino'       => $destino,
                'pago_operador' => (float) $pago,
                'version'       => $newVersion,
                'is_active'     => 0, // inactiva hasta que se active explícitamente
                'prioridad'     => $prioridad,
                'created_at'    => date('Y-m-d H:i:s'),
                'updated_at'    => date('Y-m-d H:i:s'),
            ];
            $filasOk++;
        }

        fclose($handle);

        if ($filasOk === 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'detail'          => 'No se encontraron filas válidas en el CSV.',
                'filas_rechazadas' => $filasRechazadas,
                'errores'         => $errores,
            ]);
        }

        // ── Insertar en lote ─────────────────────────────────────────────────
        $model->insertBatch($inserts);

        return $this->response->setStatusCode(201)->setJSON([
            'ok'               => true,
            'version'          => $newVersion,
            'filas_ok'         => $filasOk,
            'filas_rechazadas' => $filasRechazadas,
            'errores'          => $errores,
            'mensaje'          => "Versión {$newVersion} cargada con {$filasOk} tarifas. Para activarla usa POST /api/tabulador/activar con { version: {$newVersion} }.",
        ]);
    }

    public function activar()
    {
        $payload = $this->request->getJSON(true) ?? [];
        $version = (int) ($payload['version'] ?? 0);
        if ($version <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'version invalida']);
        }

        $model = new TabuladorModel();

        // Verificar que la versión existe
        $exists = $model->where('version', $version)->countAllResults();
        if ($exists === 0) {
            return $this->response->setStatusCode(404)->setJSON([
                'detail' => "La versión {$version} no existe en el tabulador.",
            ]);
        }

        // Desactivar todas las demás versiones y activar la solicitada (operación atómica)
        $model->set('is_active', 0)->where('version !=', $version)->update();
        $model->set('is_active', 1)->where('version', $version)->update();

        $total = $model->where('version', $version)->countAllResults();

        return $this->response->setJSON([
            'ok'      => true,
            'version' => $version,
            'tarifas' => $total,
        ]);
    }

    public function desactivar()
    {
        $payload = $this->request->getJSON(true) ?? [];
        $version = (int) ($payload['version'] ?? 0);
        if ($version <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'version invalida']);
        }

        $model = new TabuladorModel();
        $exists = $model->where('version', $version)->countAllResults();
        if ($exists === 0) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => "La versi\u00f3n {$version} no existe."]);
        }

        $model->set('is_active', 0)->where('version', $version)->update();

        return $this->response->setJSON([
            'ok'      => true,
            'version' => $version,
            'tarifas' => $exists,
        ]);
    }

    public function eliminarVersion(int $version)
    {
        if ($version <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['detail' => 'version invalida']);
        }

        $model = new TabuladorModel();
        $total = $model->where('version', $version)->countAllResults();
        if ($total === 0) {
            return $this->response->setStatusCode(404)->setJSON(['detail' => "La versi\u00f3n {$version} no existe."]);
        }

        // Hard delete de todos los registros de esta versión
        $model->where('version', $version)->delete(null, true);

        return $this->response->setJSON([
            'ok'      => true,
            'version' => $version,
            'eliminados' => $total,
        ]);
    }

    private function normalizeNullable($value): ?string
    {
        if ($value === null) {
            return null;
        }
        $text = strtoupper(trim((string) $value));
        return $text === '' ? null : $text;
    }
}
