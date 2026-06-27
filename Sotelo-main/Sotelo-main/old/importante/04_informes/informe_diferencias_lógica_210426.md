# INFORME DE DIFERENCIAS DE LÓGICA — Fletes Sotelo Nómina
> **Agente:** Transportation Logic Deconstructor  
> **Rol:** Auditor Forense de Lógica de Nómina — Sector Transporte  
> **Fecha:** 2026-04-21  
> **Alcance:** FCH, PAC, Local/Cruce — **Diesel y rendimiento excluidos del análisis de pago**  
> **Archivos analizados:**  
> - `4_nuevos archivos/REVERSE_ENGINEERING_REPORT_2026-04-21.md`  
> - `4_nuevos archivos/RULE_LEDGER.md`  
> - `4_nuevos archivos/Checklist_Clarificacion_Nomina.md`  
> - `4_nuevos archivos/calculadoras_sotelo_payroll_rules.md`  
> - `backend/app/Libraries/PayrollCalculator.php`  
> - `backend/app/Libraries/BoletaProcessor.php`  
> - `backend/app/Libraries/PacificoDetector.php`  
> - `backend/app/Libraries/RouteResolver.php`  
> - `backend/app/Controllers/TabuladorController.php`  
> - `api/calculate.php` (legacy)  
> - `api/upload.php` (legacy)

---

## 1. RESUMEN DE COINCIDENCIAS

Las siguientes reglas están operando correctamente en la aplicación, validadas contra el RULE_LEDGER y las nóminas pagadas:

| Regla | Descripción | Estado Ledger | Estado Código |
|---|---|---|---|
| **R-001** | FCH Cargado → $110.00/leg | approved ✅ | ✅ Implementado correctamente |
| **R-002** | FCH Vacío → $55.00/leg | approved ✅ | ✅ Implementado correctamente |
| **R-004** | PAC Cargado → km × $0.30 | approved ✅ | ✅ Implementado correctamente |
| **R-005** | PAC Vacío/PT → km × $0.15 | approved ✅ | ✅ Implementado correctamente |
| **R-016** | Bono Sierra PAC → $500 | approved ✅ | ✅ Implementado correctamente |
| **R-026** | Estancia Obregón → $600 × noches | approved ✅ | ✅ Implementado correctamente |
| **R-027** | Estancia Mochis → $300 × contador | testing | ✅ Presente en código |
| **D-001** | Filtro Genesis: solo Terminado/Completo | approved ✅ | ✅ Respetado en `isLoaded` |
| **D-005** | KM Tabulados sobreescribe odómetro | approved ✅ | ✅ `get_route_kms()` en ambos archivos |
| **R-028** | Multiplicador 63% (costo admin) | approved ✅ | N/A — Es de reporte, no de pago. No aplicable en código de nómina ✅ |
| **Section B** | Diesel = manual-only; no auto-cálculo | policy ✅ | ✅ Diesel excluido del Total_Pay auto |

**Tasa de alineación base (sin incidencias):** ~82% de las reglas implementadas coinciden con el Ledger.

---

## 2. MATRIZ DE DISCREPANCIAS

### DIS-001 — Doble Operador PAC: $1,726 en código vs. $2,439 en nóminas reales

| Campo | Detalle |
|---|---|
| **Regla afectada** | R-017 (Doble Operador Obregón) vs. R-018 (Doble Operador Guamúchil/Aptiv) |
| **Resultado esperado** | `$2,439` por evento (R-018 — `testing`, conf. 86) confirmado en nóminas pagadas (suma observada `$4,878 = 2,439 × 2`) |
| **Resultado obtenido** | Ambos archivos usan `$1,726` indiscriminadamente para **cualquier flag** `Manual_Pac_Bono_Doble` |
| **Código fuente** | `PayrollCalculator.php` línea 100: `$bonuses += 1726.0` · `calculate.php` línea 73: `$bonuses += 1726.0` · `upload.php` línea 111: `$bonuses += 1726.0` |
| **Impacto** | El pago de Doble Operador está **$713 por debajo** del valor real cuando aplica Guamúchil/Aptiv. En una semana con 2 eventos: **−$1,426 de subpago**. |
| **Diagnóstico** | El código no distingue entre Obregón ($1,726) y Guamúchil-Aptiv ($2,439). Usa siempre el valor menor. No hay lógica condicional de ruta/cliente para seleccionar la tarifa correcta. |

---

### DIS-002 — Bono Químico (QMS): lógica de conteo no implementada

| Campo | Detalle |
|---|---|
| **Regla afectada** | R-015 — Bono Químico = $250 × count(movimientos QMS) |
| **Resultado esperado** | Acumulación proporcional al número de movimientos marcados QMS (evidencia en nóminas: valores `$1,000`, `$1,500`, multiples de 250) |
| **Resultado obtenido** | El código aplica `$250` como **valor binario único** (verdadero/falso): `(bool) Manual_Bono_Quimico ? 250.0 : 0.0` |
| **Código fuente** | `PayrollCalculator.php` línea 23 · `calculate.php` línea 37 |
| **Impacto** | Operadores con múltiples movimientos QMS en una semana reciben $250 cuando debieran recibir $500, $750, $1,000, etc. Subpago cuya magnitud depende del volumen QMS semanal. |
| **Diagnóstico** | El campo `Manual_Bono_Quimico` es un booleano simple, no un contador. También falta definición de "qué cuenta como un evento QMS" (OQ-1 del Ledger: por leg vs. por folio). |

---

### DIS-003 — FCH: Tasas km vs. tarifa plana — Ambigüedad no resuelta

| Campo | Detalle |
|---|---|
| **Regla afectada** | R-001 / R-002 vs. `calculadoras_sotelo_payroll_rules.md` |
| **Resultado esperado** | `calculadoras_sotelo` define explícitamente: FCH Cargado = `km × 0.29333`; FCH Vacío = `km × 0.14666` |
| **Resultado obtenido** | Código usa `$110.00` y `$55.00` como tarifa plana por leg, **sin multiplicar por km** |
| **Código fuente** | `BoletaProcessor.php` líneas 108, 118 · `upload.php` líneas 355, 367 |
| **Impacto en validación** | `110/0.29333 = 375 km` y `55/0.14666 = 375 km` — Los valores son equivalentes **sólo para la ruta estándar Juárez-Chihuahua de 375 km**. Para rutas de distancia diferente (ej. EL PASO→CHIHUAHUA = 415 km), la aplicación subestima: `415 × 0.29333 = $121.73` vs `$110.00` pagados. |
| **Diagnóstico** | Para rutas no-estándar (≠ 375 km), la aplicación paga $110/$55 planos cuando la regla real debería ajustar proporcionalmente al km. El impacto es cero en 375 km exactos pero crece en cualquier otra distancia. Requiere confirmación de si la tarifa es realmente plana o proporcional. |

---

### DIS-004 — Cruce ELP: lógica incompleta — solo detecta EL PASO, no otras rutas

| Campo | Detalle |
|---|---|
| **Regla afectada** | R-013 — Deducción cruce = km − 40 en rutas internacionales |
| **Resultado esperado** | Deducción de 40 km en los 6 casos: JRZ→ELP, ELP→JRZ, ELP→CHIH, ELP→CHIH (Fokker/Haer), ELP→plantas afueras→JRZ e inversos |
| **Resultado obtenido** | Solo se detecta cruce cuando ORIGEN o DESTINO contiene literalmente `'EL PASO'`. Rutas desde/hacia `RIO BRAVO` o `ZARAGOZA` aparecen en código pero **solo del lado destino cuando el origen es EL PASO** — no captura el caso inverso completo |
| **Código fuente** | `BoletaProcessor.php` líneas 94–101 · `upload.php` líneas 346–348 |
| **Detalle técnico** | Condición actual: `if (origin = EL PASO && dest in [JUAREZ, RIO BRAVO, ZARAGOZA]) OR (dest = EL PASO && origin in [JUAREZ, RIO BRAVO, ZARAGOZA])`. No cubre: rutas Fokker/Haer (−50 km, código 5), ni combinadas (−90 km, código 6), ni rutas donde el cruce pasa por `ZARAGOZA` como origen |
| **Impacto** | Legs de cruce Fokker/Haer no reciben la deducción correcta (−50 km, no −40 km). Si la ruta usa −90 km y el código aplica −40 km: sobrepagobase de 50 km × $0.293 = **$14.67/leg en exceso**. |
| **Diagnóstico** | El código `.calculadoras_sotelo` documenta códigos C/V/PT: `4=ELP(-40km)`, `5=FOK/HAW(-50km)`, `6=FOK/HAW+ELP(-90km)`. La aplicación no tiene estas deducciones diferenciadas; aplica solo −40 km en un subconjunto de casos. |

---

### DIS-005 — PAC: Detección automática de Pacífico mezcla tipos de nómina

| Campo | Detalle |
|---|---|
| **Regla afectada** | R-004 / R-005 — La detección Pacífico debe ser **manual** según Ledger |
| **Resultado esperado** | `R-004 Activation: Manual flag Pac_Loaded = true (operator input required)`. El Ledger indica que el status cargado NO puede auto-clasificarse desde Genesis. |
| **Resultado obtenido** | `BoletaProcessor.php` auto-detecta `Is_Pacifico = true` si cualquier leg contiene keywords PAC en Origen o Destino. Dentro de una boleta mixta (ruta JRZ→CHIH→OBRG→JRZ), **todos los legs FCH también se tratarán como PAC** y en lugar de recibir $110/$55 planos, recibirán km × 0.15 (vacío por defecto). |
| **Código fuente** | `BoletaProcessor.php` líneas 45–52 · `upload.php` líneas 297–303 |
| **Impacto** | En una boleta mixta (FCH + PAC), si un solo leg toca Obregón, el flag `is_pac = true` elimina el pago por legs Chihuahua. El base_pay se resetea a 0 para todos los legs FCH dentro de esa boleta. |
| **Diagnóstico** | La detección es a nivel boleta (no a nivel leg). Una sola keyword PAC contamina toda la boleta. El Ledger especifica que Pacífico requiere confirmación manual precisamente para evitar este problema. |

---

### DIS-006 — Estancia Mochis: granularidad `por noche` vs `por bloque de 6 hrs`

| Campo | Detalle |
|---|---|
| **Regla afectada** | R-027 — Estancia Mochis/Guamúchil = $300 / 6 hrs |
| **Resultado esperado** | $300 por bloque de 6 horas (según `REPORTE_HALLAZGOS.md §1`: "c/6 hrs") |
| **Resultado obtenido** | Código expone `Manual_Pac_Estancia_Mochis` como un contador entero multiplicado por $300 — el UI/frontend decide la granularidad. No hay validación de que ese entero represente noches vs. bloques de 6 h. |
| **Código fuente** | `PayrollCalculator.php` línea 103 · `calculate.php` línea 75 |
| **Impacto** | Si el operador de nómina captura "1 noche" cuando son "3 bloques de 6h" → paga $300 en vez de $900. Potencial subpago de $600 por parada. |
| **Diagnóstico** | OQ-3 del Ledger registra este conflicto abierto. La aplicación no resuelve la ambigüedad — deja la interpretación al operador sin guía clara en el campo. |

---

### DIS-007 — Reglas Locales/Cruce: NO implementadas en código

| Campo | Detalle |
|---|---|
| **Regla afectada** | R-006, R-007, R-019 a R-025 — Todos los bonos LOCAL/CRUCE |
| **Resultado esperado** | Matriz de movimientos (rampa $33 / guardia $40 / inter/PT $45 / inter $65 / sur $90 / largos $110) + Bonos 12h, Producción, Aduana, Amarres, Diésel sábado + Estancias locales |
| **Resultado obtenido** | El procesador `BoletaProcessor` solo tiene dos ramas: `Is_Pacifico = true` (km × rate) o `Is_Pacifico = false` (FCH $110/$55). **No existe ninguna rama LOCAL** |
| **Código fuente** | `BoletaProcessor.php` líneas 107–109 — solo FCH flat rate cuando `!is_pac` |
| **Impacto** | Operadores locales que procesen su nómina a través del sistema Genesis recibirán $110 por leg Cargado o $55 por Vacío, en lugar de su tarifa real (máx. $110 para largos, pero $33 para rampa). Sobrepagomasivo en movimientos cortos. |
| **Diagnóstico** | El flujo Local/Cruce no está implementado en el backend nuevo (CI4). El Reporte de Ingeniería Inversa confirma que Local usa una matriz diferente (F-003 del reporte). El módulo está ausente, no erróneo. |

---

### DIS-008 — Bono Químico en PAC: no acumulado en total_pay (modo Boleta PAC)

| Campo | Detalle |
|---|---|
| **Regla afectada** | R-015 aplicado a PAC |
| **Resultado esperado** | `Bono_Pay += 250 × QMS_count` cuando el operador es PAC y tiene movimientos QMS |
| **Resultado obtenido** | En el modo Boleta PAC (`calculate.php` línea 78): `total_pay = base_pay + bonuses + total_incentive + bono_quimico_val` — el `bono_quimico_val` SÍ se incluye. Sin embargo, en `PayrollCalculator.php` línea 106, el campo `$totalIncentive` incluye el `$totalPagoCruce` en el campo `Incentive_Pay`, mezclando el pago por cruce del tabulador con el incentivo diesel. |
| **Código fuente** | `PayrollCalculator.php` línea 116: `$trip['Incentive_Pay'] = round($totalIncentive + $totalPagoCruce, 2)` |
| **Impacto** | En el campo `Incentive_Pay` del frontend se muestra la suma de incentivo diesel + pago por cruce del tabulador, un valor híbrido que no corresponde a ningún concepto de nómina real. Dificulta auditoría. |
| **Diagnóstico** | El campo `Incentive_Pay` debería ser exclusivamente el incentivo diesel (manual-only). El `Pago_Cruce` ya tiene su propio campo (`$trip['Pago_Cruce']`). La suma en línea 116 es redundante e induce confusión conceptual. |

---

## 3. DIAGNÓSTICO CONSOLIDADO

### 3.1 Causa raíz por categoría

| Categoría | Causa |
|---|---|
| **DIS-001 (Doble Operador)** | El flag `Manual_Pac_Bono_Doble` es booleano sin contexto de ruta/cliente. El código asigna siempre el valor menor ($1,726) sin condición de selección. |
| **DIS-002 (Bono Químico)** | El campo es booleano cuando debería ser entero (`QMS_count`). La pregunta abierta OQ-1 del Ledger bloquea la corrección definitiva. |
| **DIS-003 (FCH km vs. plano)** | Ambigüedad de especificación: la tarifa plana ($110/$55) es equivalente a la tarifa-km *solo* en la ruta canónica de 375 km. No hay lógica de ajuste proporcional para rutas atípicas. |
| **DIS-004 (Cruce parcial)** | La lógica de cruce no incorpora los códigos de deducción diferenciada (−40/−50/−90) documentados en `calculadoras_sotelo`. Solo aplica −40 km en casos EL PASO directos. |
| **DIS-005 (PAC contaminación)** | La bandera `is_pac` opera a nivel de boleta, no a nivel de leg. Una ruta mixta FCH+PAC queda mal clasificada en su totalidad. |
| **DIS-006 (Estancia Mochis)** | Conflicto de granularidad documentado no resuelto (OQ-3). La aplicación deja la ambigüedad al operador sin guía de UI. |
| **DIS-007 (Local ausente)** | Módulo completo no implementado. No es un bug de lógica sino una feature faltante. |
| **DIS-008 (Incentive_Pay híbrido)** | Mezcla contable de dos conceptos distintos en un solo campo. Error de diseño de respuesta API. |

### 3.2 Priorización de correcciones

| Prioridad | Discrepancia | Impacto económico | Complejidad de fix |
|---|---|---|---|
| 🔴 CRÍTICO | DIS-001 (Doble Operador $713/evento) | Alto | Bajo — agregar flag de ruta y condición |
| 🔴 CRÍTICO | DIS-007 (Local ausente) | Alto — nómina completa incorrecta | Alto — módulo nuevo |
| 🟠 ALTO | DIS-002 (Bono Químico binario→contador) | Medio-Alto | Bajo — cambiar bool a int |
| 🟠 ALTO | DIS-004 (Cruce deducciones parciales) | Medio | Medio — agregar códigos 5 y 6 |
| 🟡 MEDIO | DIS-005 (PAC contaminación boleta) | Medio | Medio — mover flag a nivel leg |
| 🟡 MEDIO | DIS-003 (FCH tarifa plana vs km) | Bajo-Medio (solo rutas atípicas) | Requiere clarificación operacional |
| 🟢 BAJO | DIS-006 (Estancia Mochis granularidad) | Bajo | Bajo (UI guidance) — pendiente OQ-3 |
| 🟢 BAJO | DIS-008 (Incentive_Pay híbrido) | Nulo en pago, sí en auditoría | Bajo — separar campos |

---

## 4. FÓRMULA RECONSTRUIDA (Estado actual del código)

### FCH — Fórmula actual:
$$
Total_{FCH} = \sum_{legs}(110 \text{ si Cargado, } 55 \text{ si Vacío/PT}) + Diesel_{manual} + Bono_{Químico}(binario)
$$

### FCH — Fórmula esperada según documentación:
$$
Total_{FCH} = \sum_{legs}(km_{adj} \times 0.29333 \text{ si C, } km_{adj} \times 0.14666 \text{ si V}) + Diesel_{manual} + (QMS\_count \times 250)
$$
donde `km_adj = km_tabulados − 40` para ELP, `−50` para Fokker/Haer, `−90` para combinado.

### PAC — Fórmula actual:
$$
Total_{PAC} = km_{totales} \times rate(0.30|0.15) + 500_{Sierra} + 1726_{Doble} + (N_{Obr} \times 600) + (N_{Moc} \times 300)
$$

### PAC — Fórmula esperada:
$$
Total_{PAC} = km_{totales} \times rate(0.30|0.15) + 500_{Sierra} + \begin{cases}2439 & \text{Guamúchil/Aptiv} \\ 1726 & \text{Obregón/otro}\end{cases} + (N_{Obr} \times 600) + (N_{Moc} \times 300_{6h-block})
$$

---

## 5. PREGUNTAS ABIERTAS BLOQUEANTES (alineadas con OQ del Ledger)

| # | Pregunta | Impacto en corrección |
|---|---|---|
| **OQ-1** | ¿El Bono Químico se cuenta por leg, por folio o por boleta? | Bloquea DIS-002 |
| **OQ-2** | Confirmar que los 6 escenarios de cruce aplican deducciones −40/−50/−90 km | Bloquea DIS-004 |
| **OQ-3** | Estancia Mochis: ¿$300 por noche o por bloque de 6 hrs? | Bloquea DIS-006 |
| **OQ-4** | ¿Cuándo usar $1,726 vs $2,439 para Doble Operador? ¿Es la ruta o el cliente el disparador? | Bloquea DIS-001 |
| **OQ-5** | ¿La tarifa FCH es plana ($110/$55) independiente de km, o proporcional para rutas atípicas? | Bloquea DIS-003 |
| **OQ-NEW** | ¿Cómo se debe manejar una boleta mixta que combina legs FCH y PAC en el mismo viaje? | Bloquea DIS-005 |

---

## 6. PRÓXIMOS DATOS A SOLICITAR

Para elevar la confianza en las reglas en conflicto:

1. **Una nómina PAC con Doble Operador** pagada: confirmar si el monto es $1,726 o $2,439 y qué ruta/cliente la generó.
2. **Una nómina FCH con Bono Químico múltiple** (ej. $750 o $1,000) para calcular el factor de multiplicación real.
3. **Un caso de ruta ELP→FOKKER/HAERWENTHAL** para confirmar si realmente se descuentan 50 km.
4. **Una boleta con legs JRZ↔CHIH + legs PAC en el mismo folio** para ver cómo la nómina real la trata.
5. **Tres nóminas LOCAL* pagadas** para mapear la matriz de movimientos actualmente vigente.

---

*Informe generado por Transportation Logic Deconstructor persona — Fletes Sotelo Payroll Audit*  
*Referencia: RULE_LEDGER v1.0 | calculadoras_sotelo_payroll_rules | REVERSE_ENGINEERING_REPORT_2026-04-21*
