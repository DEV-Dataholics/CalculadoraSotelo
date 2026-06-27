<?php

namespace App\Libraries;

class BoletaProcessor
{
    /** @var array<string, float> */
    private array $unitYields;
    private RouteResolver $routeResolver;
    private PacificoDetector $pacificoDetector;

    /** @param array<string, float> $unitYields */
    public function __construct(array $unitYields, RouteResolver $routeResolver, PacificoDetector $pacificoDetector)
    {
        $this->unitYields = $unitYields;
        $this->routeResolver = $routeResolver;
        $this->pacificoDetector = $pacificoDetector;
    }

    /** @param array<int, array<string, string>> $rows */
    public function processByBoleta(array $rows, string $driverName): array
    {
        $byBoleta = [];
        foreach ($rows as $row) {
            $boleta = trim((string) ($row['Boleta'] ?? ''));
            if ($boleta === '') {
                $boleta = 'SIN_BOLETA';
            }
            $byBoleta[$boleta][] = $row;
        }

        $entries = [];

        foreach ($byBoleta as $boleta => $boletaRows) {
            usort($boletaRows, function ($a, $b): int {
                $ta = $this->parseTs((string) ($a['Arranque'] ?? ''));
                $tb = $this->parseTs((string) ($b['Arranque'] ?? ''));
                return ($ta ?? 0) <=> ($tb ?? 0);
            });

            $firstRow = $boletaRows[0];
            $unit = trim((string) ($firstRow['Tractor'] ?? ''));
            $unitYield = (float) ($this->unitYields[$unit] ?? 2.37341);

            $isPac = false;
            foreach ($boletaRows as $row) {
                if ($this->pacificoDetector->isPacifico((string) ($row['Origen'] ?? ''))
                    || $this->pacificoDetector->isPacifico((string) ($row['Destino'] ?? ''))) {
                    $isPac = true;
                    break;
                }
            }

            $basePay = 0.0;
            $totalKmsRaw = 0.0;
            $totalKmsAdjusted = 0.0;
            $hasForaneo = false;
            $startTs = null;
            $endTs = null;
            $tableRows = [];
            // B-04: si alguna pierna usa km del CSV en lugar del tabulador, la boleta
            // queda en NEEDS_INPUT para revisión manual del operador.
            $hasKmFallback = false;

            foreach ($boletaRows as $row) {
                $origin = strtoupper(trim((string) ($row['Origen'] ?? '')));
                $dest = strtoupper(trim((string) ($row['Destino'] ?? '')));
                $status = strtoupper(trim((string) ($row['Estatus flete'] ?? '')));

                // D-001 (RULE_LEDGER): Solo statuses válidos avanzan a nómina.
                // FACTURADO = viaje cargado completado, COMPLETO/TERMINADO = viaje vacío/PT completado.
                // EN TRÁNSITO, CANCELADO y cualquier otro status se descartan.
                $validStatuses = ['FACTURADO', 'COMPLETO', 'TERMINADO'];
                if ($status !== '' && !in_array($status, $validStatuses, true)) {
                    continue;
                }
                $tipo = strtoupper(trim((string) ($row['Tipo'] ?? '')));
                $comments = strtoupper(trim((string) ($row['Comentarios'] ?? '')));

                $tsStart = $this->parseTs((string) ($row['Arranque'] ?? ''));
                $tsEnd = $this->parseTs((string) ($row['Arribo destino'] ?? ''));
                if ($tsStart && ($startTs === null || $tsStart < $startTs)) {
                    $startTs = $tsStart;
                }
                if ($tsEnd && ($endTs === null || $tsEnd > $endTs)) {
                    $endTs = $tsEnd;
                }

                // ── B-01: Jerarquía explícita Status > Tipo > Comentarios ───────────────
                // FACTURADO (cargado) nunca es anulado por el comentario "VACIO".
                // COMPLETO/TERMINADO significa siempre viaje vacío o PT.
                if ($status === 'FACTURADO') {
                    // Prioridad máxima: el sistema de Genesis marcó el flete como facturado (cargado).
                    $isLoaded = true;
                } elseif ($status === 'COMPLETO' || $status === 'TERMINADO') {
                    // COMPLETO/TERMINADO = pierna de retorno vacío o PT.
                    $isLoaded = false;
                } else {
                    // Sin status definitivo: inferir desde Tipo.
                    $isLoaded = in_array($tipo, ['IMP-01', 'IMP-02', 'EXP-01', 'EXP-02', 'FOR-01', 'FOR-02', 'MDC-01', 'MDC-02', 'TRI-01', 'TRI-02', 'TRE-01', 'TRE-02', 'LOC-01', 'LOC-02'], true);
                    // Tipos explícitamente vacíos/PT anulan la inferencia anterior.
                    if (in_array($tipo, ['PTT-00', 'LOC-00', 'FOR-00', 'IMP-00', 'EXP-00'], true)
                        || strpos($comments, 'VACIO') !== false
                        || strpos($comments, 'VASIO') !== false) {
                        $isLoaded = false;
                    }
                }

                if (strpos($tipo, 'FOR') !== false || strpos($origin, 'CHIH') !== false || strpos($dest, 'CHIH') !== false) {
                    $hasForaneo = true;
                }

                // B-04: Usar resolveWithSource() para detectar si se usó el tabulador o el odómetro.
                $resolved = $this->routeResolver->resolveWithSource($origin, $dest, (float) ($row['Kms'] ?? 0));
                $rawKms = $resolved['km'];
                $kmSource = $resolved['source'];
                if ($kmSource === 'FALLBACK') {
                    $hasKmFallback = true;
                }
                $kmsAdj = $rawKms;

                // B-02 / D-004 fix: La deducción ELP solo aplica a piernas FCH (no PAC).
                // calculadoras_sotelo_payroll_rules.md §Códigos C/V/PT define 3 casos:
                //   Código 4 = ELP estándar          → deducir 40 km
                //   Código 5 = FOK/HAW               → deducir 50 km
                //   Código 6 = FOK/HAW + ELP         → deducir 90 km
                $isCruce      = false;
                $cruceKmDeduct = 0.0;
                $isLegPac = $this->pacificoDetector->isPacifico($origin) || $this->pacificoDetector->isPacifico($dest);
                if (!$isLegPac) {
                    $isFokHaw  = strpos($origin, 'FOK') !== false || strpos($dest, 'FOK') !== false
                              || strpos($origin, 'HAW') !== false || strpos($dest, 'HAW') !== false
                              || strpos($origin, 'FOKKER') !== false || strpos($dest, 'FOKKER') !== false
                              || strpos($origin, 'HAWKINS') !== false || strpos($dest, 'HAWKINS') !== false;
                    $isElp     = (strpos($origin, 'EL PASO') !== false && (strpos($dest, 'JUAREZ') !== false || strpos($dest, 'RIO BRAVO') !== false || strpos($dest, 'ZARAGOZA') !== false))
                              || (strpos($dest, 'EL PASO') !== false && (strpos($origin, 'JUAREZ') !== false || strpos($origin, 'RIO BRAVO') !== false || strpos($origin, 'ZARAGOZA') !== false));

                    if ($isFokHaw && $isElp) {
                        // Código 6: FOK/HAW + ELP → -90 km
                        $isCruce       = true;
                        $cruceKmDeduct = 90.0;
                    } elseif ($isFokHaw) {
                        // Código 5: solo FOK/HAW → -50 km
                        $isCruce       = true;
                        $cruceKmDeduct = 50.0;
                    } elseif ($isElp) {
                        // Código 4: ELP estándar → -40 km
                        $isCruce       = true;
                        $cruceKmDeduct = 40.0;
                    }

                    if ($isCruce && $rawKms >= $cruceKmDeduct) {
                        $kmsAdj = max(0.0, $rawKms - $cruceKmDeduct);
                    }
                }

                $totalKmsRaw += $rawKms;
                $totalKmsAdjusted += $kmsAdj;

                // B-05: El pago por pierna se determina individualmente según si la pierna es PAC o FCH.
                // Esto permite boletas mixtas: una pierna CHI→JRZ paga FCH ($110/$55),
                // mientras que una pierna a OBREGON paga PAC ($0.30/$0.15 por km).
                if ($isLegPac) {
                    $legBasePay = $isLoaded ? round($kmsAdj * 0.30, 2) : round($kmsAdj * 0.15, 2);
                } else {
                    $legBasePay = $isLoaded ? 110.00 : 55.00;
                }
                $basePay += $legBasePay;

                $cvpt = 'V';
                if (strpos($tipo, 'PT') !== false || strpos($tipo, 'PTT') !== false) {
                    $cvpt = 'PT';
                } elseif ($isLoaded) {
                    $cvpt = 'C';
                }

                // B-05: legPay ya calculado arriba como $legBasePay (por km para PAC, flat para FCH).
                $legPay = $legBasePay;
                // B-03: litrosPago son LITROS de referencia para el operador — no pesos.
                // NO se suman al Total_Pay; están aquí solo para visualización en la boleta.
                $litrosPago = $unitYield > 0 ? round($kmsAdj / $unitYield, 2) : 0.0;

                $tableRows[] = [
                    'Folio_Liquidacion' => trim((string) ($row['Factura'] ?? '')),
                    'Coordenada' => trim((string) ($row['Coordenada'] ?? '')),
                    'Fecha_Salida' => trim((string) ($row['Arranque'] ?? '')),
                    'Fecha_Llegada' => trim((string) ($row['Arribo destino'] ?? '')),
                    'Origen' => trim((string) ($row['Origen'] ?? '')),
                    'Destino' => trim((string) ($row['Destino'] ?? '')),
                    'Kms' => $rawKms,
                    'Recarga' => 0.0,
                    'Rendimiento' => $unitYield,
                    'Peso_Carga' => '',
                    'CVP' => $cvpt,
                    'Remolque' => trim((string) ($row['Remolque'] ?? '')),
                    'Cliente' => trim((string) ($row['Cliente'] ?? '')),
                    'Pago_Por_Km' => $legPay,
                    'Litros_A_Pago' => $litrosPago,
                    // B-03: Litros_Referencia son LITROS (no pesos). Solo para referencia del operador.
                    // PayrollCalculator NO debe sumarlos al Total_Pay (violación de política manual-only).
                    'Litros_Referencia' => $litrosPago,
                    // Diesel_A_Favor se deja en null para forzar captura manual del operador.
                    'Diesel_A_Favor' => null,
                    // B-04: fuente del km (TABULADO = tabulador maestro, FALLBACK = odómetro del CSV).
                    'Km_Source' => $kmSource,
                    'Tipo' => trim((string) ($row['Tipo'] ?? '')),
                    'Estatus_Flete' => trim((string) ($row['Estatus flete'] ?? '')),
                    'Is_Loaded' => $isLoaded,
                    // Campo necesario para que PayrollCalculator consulte el tabulador de tarifas
                    'Cruce' => $isCruce ? 'PUENTE ZARAGOZA' : null,
                ];
            }

            $allowedLiters = $totalKmsAdjusted / ($unitYield > 0 ? $unitYield : 2.37341);
            $dieselRate = $isPac ? 16.00 : ($hasForaneo ? 14.85 : 14.50);

            $entries[] = [
                'id' => $driverName . '_' . $boleta,
                'source_type' => 'GENESIS_BOLETA',
                'Boleta' => $boleta,
                'Driver' => $driverName,
                'Unit' => $unit,
                'Start_Date' => $startTs ? date('Y-m-d H:i', $startTs) : 'Desconocido',
                'End_Date' => $endTs ? date('Y-m-d H:i', $endTs) : 'En Progreso',
                'Total_Kms_Raw' => (float) $totalKmsRaw,
                'Total_Kms_Paid' => (float) $totalKmsAdjusted,
                'Allowed_Liters' => round((float) $allowedLiters, 2),
                'Yield_Used' => (float) $unitYield,
                'Base_Pay' => (float) $basePay,
                'Diesel_Rate' => $dieselRate,
                'Suggested_Cost' => round((float) $allowedLiters * $dieselRate, 2),
                'Manual_Refuel_Liters' => 0.0,
                'Manual_Actual_Price_Per_Liter' => 0.0,
                'Manual_Bono_Quimico' => false,
                'Payroll_Week' => $this->getPayrollWeek($startTs),
                // B-04: Flag explícita para que el frontend muestre la alerta de odómetro.
                'Has_Km_Fallback' => $hasKmFallback,
                'Status' => 'NEEDS_INPUT',
                'Is_Pacifico' => $isPac,
                'Manual_Pac_Loaded' => false,
                'Manual_Pac_Bono_Sierra' => false,
                'Manual_Pac_Bono_Doble' => false,
                'Manual_Pac_Estancia_Obregon' => 0,
                'Manual_Pac_Estancia_Mochis' => 0,
                'Rows' => $tableRows,
            ];
        }

        return $entries;
    }

    private function parseTs(string $str): ?int
    {
        $str = trim($str);
        if ($str === '' || $str === '0') {
            return null;
        }

        $ts = strtotime($str);
        return ($ts !== false && $ts > 0) ? $ts : null;
    }

    private function getPayrollWeek(?int $ts): int
    {
        if (!$ts) {
            return 0;
        }

        return (int) date('W', $ts) + 1;
    }
}
