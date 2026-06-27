# Reporte de Auditoría e Implementación: Fase 2 (Sotelo PayrollTool)
**Fecha:** 22 de Marzo de 2026
**Autor:** Antigravity (IA Asistente)
**Estado:** `COMPLETADO` / `DESPLEGADO LOCALMENTE`

Este documento detalla exhaustivamente todos los cambios a nivel de código realizados en la **Fase 2**, confirmando el cumplimiento exacto del `SOW` y `guideline-mvp.md`.

---

## 1. Ajuste de Flujo Diésel Semi-Automático (Hito 1)

### Backend (`api/upload.php`)
* **Cambio:** Se deshabilitó el pre-cálculo del incentivo (`Incentive_Pay`) durante la carga del CSV.
* **Cambio:** Se inyectó la propiedad `Suggested_Cost` calculada dinámicamente (`Allowed_Liters * Diesel_Rate`).
* **Cambio:** Todos los viajes (Pacífico y Chihuahua) se inicializan estrictamente con el estatus `'Status' => 'NEEDS_INPUT'`.

### Backend (`api/calculate.php`)
* **Cambio:** El motor de cálculo fue modificado para aceptar `$trip['Manual_Actual_Price_Per_Liter']` y `$trip['Manual_Refuel_Liters']`.
* **Cambio:** Implementación de **Fallback de Precio**:
  ```php
  $manual_price = (float)($trip['Manual_Actual_Price_Per_Liter'] ?? 0);
  $effective_rate = $manual_price > 0 ? $manual_price : $rate; // $rate es el Diesel_Rate inyectado en upload
  $incentive = max(0.0, $allowed - $refueled) * $effective_rate;
  ```
* **Cambio:** El `Status` de los viajes Foráneos/Locales ahora transiciona correctamente de `NEEDS_INPUT` a `PENDING` tras ser calculados.

### Frontend
* **`App.jsx`:** 
  - La visualización de pestañas ahora aterriza por defecto en `NEEDS_INPUT` ("Incomplete") para forzar la atención del operador.
  - Corrección de Robustez: Se interceptan adecuadamente los errores `400 Bad Request` del API (e.g. carga de Excel inválido) con una alerta, evitando cierres abruptos de React (`Trips.map is undefined`).
* **`SummaryBar.jsx`:**
  - El resumen consolidado dejó de re-calcular fórmulas. Ahora delega confiando 100% en la propiedad agregada `$trip['Calculated_Incentive']` o `$trip['Incentive_Pay']` enviada por el backend.
* **`TripCard.jsx`:**
  - Se agregaron inputs manuales explícitos para **Reales (L)** y **Precio/L**.
  - Se visualizan en formato de etiqueta estática: el costo "Base", "Permitidos" y "Costo Espe.".

---

## 2. Nuevas Reglas de Negocio (Hito 2)

### Bono Químico ($250)
* **Backend (`api/calculate.php`)**: Se configuró para leer la propiedad booleana `Manual_Bono_Quimico`. Si está activa remata el `$total_pay` con +250 MXN (aplicable universalmente a viajes foráneos y pacífico).
* **Frontend (`TripCard.jsx`)**: Se habilitó un Toggle Switch llamado **"Químico"** en la tarjeta principal, enviando al backend un trigger en vivo e impactando al instante los pre-cálculos del UI (Estimado de +$250 en la sumatoria).

### Deducción de Cruce Internacional (-40 kms)
* **Backend (`api/upload.php`)**: 
  - Lógica inyectada al vuelo en `calculate_chihuahua_payroll` justo después de calcular el kilometraje base de la ruta.
  - Se aislaron estrictamente **los 6 ejes frontera**: `EL PASO <-> JUAREZ`, `EL PASO <-> RIO BRAVO`, y `EL PASO <-> ZARAGOZA`.
  ```php
  // Regla estricta verificada:
  if ($is_cruce && $raw_kms >= 40.0) { $kms_adj = max(0.0, $raw_kms - 40.0); }
  ```

### Separación de Zonas de Precio Diésel ($14.50 vs $14.85)
* **Backend (`api/upload.php`)**: 
  - Regla de inyección condicional: Si cualquier ruta contiene destinos `CHIH` o el pre-fijo `FOR` (Foráneo), el viaje completo recibe un `Diesel_Rate` inyectado de **$14.85**. 
  - En cualquier otro caso (100% Local o Cruce Fronterizo), inyecta automáticamente el Rate estricto de **$14.50**.

---

## 3. Catálogos y Estabilidad (Hito 3)

### Rendimientos y Rutas Oficiales
* **`api/upload.php`:** 
  - Se extrajo del documento de Seguimiento los rendimientos con **5 decimales requeridos** para todas las unidades (e.g. `F-121 => 2.701058`).
  - Se inyectó la tabla unificada de **140 distancias manuales mapeadas a cliente**, incluyendo las combinaciones específicas como `APTIV GUAMUCHIL FV52|FLETES SOTELO => 1330`.

### Clasificación Génesis
* **`api/upload.php`:** 
  - Adaptador blindado para clasificar viajes cargados vs viajes vacíos.
  - Se reconocen estáticamente las series explícitas: `IMP-01`, `IMP-02`, `EXP-01`, `EXP-02`, `FOR-01`, `FOR-02`, `MDC-01`, `MDC-02`, `TRI-01`, `TRI-02`, `TRE-01`, `TRE-02`, `LOC-01`, `LOC-02` como **VIAJE CARGADO ($110.00 base)**.
  - Las terminaciones tipo `-00` (e.g. `PTT-00`, `LOC-00`, `IMP-00`) junto con el comentario "VACIO" catalogan obligatoriamente el trayecto como **MOVIMIENTO VACÍO ($55.00 base)**.

---

## Conclusión

El proyecto ha superado las métricas de aceptación de la **Fase 2**. El bundle del *Frontend SPA (Vite)* está pre-generado y alojado nativamente para acompañar la lógica monolítica sin estado (stateless) de PHP 8.x. El sistema no requerirá BD y está listo para recibir operaciones de control y pago nominal directamente de los ejecutivos con los exports transaccionales de Génesis.
