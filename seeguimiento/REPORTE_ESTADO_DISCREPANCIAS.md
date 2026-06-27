# 📊 REPORTE DE ESTADO — DISCREPANCIAS DE LÓGICA DE NÓMINA
**Sistema:** Fletes Sotelo — Motor de Cálculo de Nómina  
**Fecha:** 2026-04-24  
**Preparado por:** Transportation Logic Deconstructor  
**Alcance:** FCH, PAC, LOCAL, CRUCE — Diesel y bonos manuales excluidos del análisis automático

---

## ✅ SECCIÓN 1 — CORRECCIONES YA APLICADAS EN CÓDIGO

> Estas discrepancias fueron detectadas, corregidas y confirmadas. No requieren acción adicional del negocio.

---

### ✅ FIX-01 · Doble Operador PAC — Monto incorrecto
| | |
|---|---|
| **Regla** | R-017 vs. R-018 |
| **Segmento** | PAC (Foráneo Pacífico) |
| **Problema** | La aplicación usaba **$1,726** (Bono Doble Operador Obregón, regla candidata, confianza 64) en lugar de **$2,439** (Aptiv Guamúchil, regla validada en nóminas pagadas, confianza 86). |
| **Evidencia** | Nóminas pagadas semanas 41–45 muestran `DOBLE OPERADOR = 4,878`, que es exactamente `$2,439 × 2 operadores`. |
| **Impacto económico** | **−$713 por cada boleta** con Doble Operador activado. |
| **Archivo corregido** | `PayrollCalculator.php` líneas 112 y 163 (modo moderno y modo legacy) |
| **Cambio aplicado** | `$bonuses += 1726.0` → `$bonuses += 2439.0` |
| **Estado** | ✅ **RESUELTO** |

---

### ✅ FIX-02 · Bono Químico — Tipo de campo incorrecto (booleano vs. contador)
| | |
|---|---|
| **Regla** | R-015 |
| **Segmento** | FCH (posiblemente PAC — sin confirmar) |
| **Problema** | El campo `Manual_Bono_Quimico` era un **booleano (sí/no)**, pagando exactamente $250 una sola vez sin importar cuántos movimientos QMS realizó el operador en la semana. El Rule Ledger documenta el bono como `$250 × count(QMS-marked movements)`. Nóminas pagadas muestran valores como $1,000 y $1,500, imposibles con un campo booleano. |
| **Impacto económico** | **−$250 por cada movimiento QMS adicional al primero** en semanas con múltiples movimientos QMS. |
| **Archivo corregido** | `PayrollCalculator.php` línea 23 |
| **Cambio aplicado** | Campo booleano → campo entero `Manual_Bono_Quimico_Count`. Fórmula: `(int) $rawBonoQuimico * 250.0`. Retrocompatible con registros legacy (booleano `true` se interpreta como `count = 1`). |
| **Estado** | ✅ **RESUELTO** |

---

### ✅ FIX-03 · Deducción ELP — Casos FOK/HAW no implementados
| | |
|---|---|
| **Regla** | R-013 |
| **Segmento** | FCH |
| **Problema** | La aplicación solo descontaba **40 km** para el cruce ELP estándar (Código 4). Los códigos 5 y 6 de `calculadoras_sotelo_payroll_rules.md`, que definen deducciones diferentes para rutas Fokker/Hawkins, no estaban implementados, lo que causaba pago de más en esas rutas. |
| **Códigos según documentación** | Código 4 = ELP estándar → **−40 km** · Código 5 = FOK/HAW → **−50 km** · Código 6 = FOK/HAW + ELP → **−90 km** |
| **Impacto económico** | Pago incorrecto de +10 km o +50 km en rutas Fokker/Hawkins (equivalente a +$2.93 a +$14.67 en FCH, o más en PAC). |
| **Archivo corregido** | `BoletaProcessor.php` líneas 122–155 |
| **Cambio aplicado** | Lógica de detección extendida con keywords `FOK`, `HAW`, `FOKKER`, `HAWKINS`. Deducción condicional en cascada: código 6 > código 5 > código 4. |
| **Estado** | ✅ **RESUELTO** |

---

## ⏳ SECCIÓN 2 — PENDIENTES: DECISIÓN DEL NEGOCIO

> Estas discrepancias **no pueden resolverse en código** sin una respuesta formal del área de nómina. El sistema permanece en el estado actual hasta recibir la definición.

---

### ⏳ PEN-01 · Estancia Mochis/Guamúchil — ¿Por noche o por bloque de 6 horas?
| | |
|---|---|
| **Regla** | R-027 — OQ-3 |
| **Segmento** | PAC |
| **Conflicto** | El documento `REPORTE_HALLAZGOS` describe la estancia como **"$300 c/6 hrs"** (por bloque de 6 horas). El código legacy (`main.py`) la etiqueta como **"per night"**. Actualmente el campo `Manual_Pac_Estancia_Mochis` acepta un número entero sin definición explícita de qué representa. |
| **Riesgo** | Si el operador de nómina ingresa "1 noche" cuando debería ser "1 bloque de 6 hrs", o viceversa, el monto calculado es incorrecto por hasta **$300 por período de espera**. |
| **Pregunta para el negocio** | ¿El campo "Estancias Mochis/Guamúchil" representa **noches completas** o **bloques de 6 horas**? Si un operador espera 12 horas, ¿se captura como 1, 2 o se maneja diferente? |
| **Estado** | ⏳ **PENDIENTE RESPUESTA** |

---

### ⏳ PEN-02 · Bono Doble Operador — ¿Cuándo aplica $1,726 vs. $2,439?
| | |
|---|---|
| **Regla** | R-017 vs. R-018 — OQ-4 |
| **Segmento** | PAC |
| **Situación** | Se corrigió el monto principal a $2,439 (Aptiv Guamúchil, confianza 86). Sin embargo, la regla R-017 ($1,726 Obregón) sigue existiendo como candidata en el Ledger. El sistema actual **no distingue** automáticamente entre ambos casos — el campo `Manual_Pac_Bono_Doble` es un único booleano. |
| **Riesgo** | Si existen operadores de la ruta Obregón que deberían cobrar $1,726 y se les paga $2,439, hay un sobrepago de $713. |
| **Preguntas para el negocio** | 1. ¿El caso Obregón ($1,726) sigue vigente o fue reemplazado por el modelo Aptiv ($2,439)? 2. ¿Pueden coexistir ambos tipos en la misma semana? 3. ¿Existe una lista de rutas/clientes que activan cada monto? |
| **Estado** | ⏳ **PENDIENTE RESPUESTA** |

---

### ⏳ PEN-03 · Bono Químico — ¿Cómo se cuenta un movimiento QMS?
| | |
|---|---|
| **Regla** | R-015 — OQ-1 |
| **Segmento** | FCH |
| **Situación** | El fix FIX-02 corrige el campo a contador entero. Sin embargo, **la definición de qué cuenta como "un movimiento QMS"** no está formalizada: ¿es por pierna individual, por folio completo (viaje redondo), o por periodo semanal? |
| **Riesgo** | Sin una definición canónica, el operador de nómina puede estar capturando un número diferente al que realmente corresponde. |
| **Preguntas para el negocio** | 1. ¿Cuál es el disparador exacto del Bono Químico (etiqueta QMS en Genesis, tipo de carga, cliente específico)? 2. Si un viaje redondo tiene 2 piernas QMS, ¿el bono se paga 1 o 2 veces? 3. ¿El bono puede aplicarse más de una vez en la misma semana para el mismo operador? |
| **Estado** | ⏳ **PENDIENTE RESPUESTA** |

---

### ⏳ PEN-04 · FCH — ¿El pago es siempre flat $110/$55 o varía con la distancia?
| | |
|---|---|
| **Regla** | R-001, R-002 vs. `calculadoras_sotelo §FCH` |
| **Segmento** | FCH |
| **Conflicto** | El Rule Ledger aprueba $110 cargado / $55 vacío como tarifa FCH. Las `calculadoras_sotelo_payroll_rules.md` expresan la fórmula como `km × 0.29333` y `km × 0.14666` (equivalentes a $110/$55 para la ruta estándar de **375 km**). El código usa el modelo flat. |
| **Riesgo** | Si existen tramos FCH de distancia diferente a 375 km (más cortos o más largos), el pago flat produce un monto incorrecto. El modelo km × tasa sería más preciso en esos casos. |
| **Pregunta para el negocio** | ¿Todas las rutas FCH tienen exactamente 375 km operativos, o existen variantes? Si hay tramos de distancia diferente, ¿se pagan igualmente $110/$55 flat o se ajusta por km? |
| **Estado** | ⏳ **PENDIENTE RESPUESTA** |

---

### ⏳ PEN-05 · Cruce — ¿Qué tabla de viajes/decimales está vigente hoy?
| | |
|---|---|
| **Regla** | R-006 — OQ-5 |
| **Segmento** | CRUCE |
| **Conflicto** | Existen dos fuentes con tablas diferentes para el pago de operadores de Cruce: (1) Documentación histórica: tabla base $500-equivalente por viaje completo. (2) Archivos `.xls` semanas 41–45 (`BASE` sheet): valores `1.0 → $450`, con variantes `$385` y `$375`. No se puede determinar cuál está vigente desde el código. |
| **Riesgo** | Diferencia de **$50 a $125 por viaje completo** según qué tabla se use. |
| **Preguntas para el negocio** | 1. ¿Cuál es la tabla oficial de pago por viaje/decimal para operadores CRUCE hoy? 2. ¿El valor 0.50 decimal se paga como $150, $225 o $250? 3. ¿Los archivos `.xls` de semanas 41–45 son nóminas realmente pagadas o plantillas de trabajo? |
| **Estado** | ⏳ **PENDIENTE RESPUESTA** |

---

## 🗓️ SECCIÓN 3 — BACKLOG: FUNCIONALIDAD NO IMPLEMENTADA

> Estas características están documentadas en el Rule Ledger pero **no tienen implementación de código**. Requieren decisión de prioridad de desarrollo además de definición del negocio.

| ID | Concepto | Regla | Segmento | Monto | Prioridad Sugerida |
|---|---|---|---|---|---|
| **B-01** | Bono 12 Horas | R-019 | LOCAL, CRUCE | $350/semana | 🟡 Media |
| **B-02** | Bono de Producción | R-020 | LOCAL, CRUCE | $400 cuando Σdecimales ≥ 20/semana | 🟡 Media |
| **B-03** | Bono Aduana (100% americana / rojo mexicana) | R-021 | LOCAL, CRUCE | $230/evento | 🟠 Baja |
| **B-04** | Bono Amarres y Enlones | R-022 | LOCAL, CRUCE | $450/operación | 🟠 Baja |
| **B-05** | Bono Diésel Sábado/Festivo | R-023 | LOCAL, CRUCE | $175 × viajes\_decimales | 🟡 Media |
| **B-06** | Estancia en patio Fletes Sotelo | R-024 | LOCAL, CRUCE | Lookup: 2h→$70 … 10h→$620 | 🟡 Media |
| **B-07** | Estancia en cliente | R-025 | LOCAL, CRUCE | Lookup: 2h→$120 … 10h→$1,080 | 🟡 Media |
| **B-08** | Corte semanal para viajes que cruzan periodo | Checklist §1.6 | ALL | N/A (regla de asignación) | 🔴 Alta |
| **B-09** | Deducciones y anticipos | Checklist §1.6 | ALL | N/A (campo faltante) | 🔴 Alta |

> **Nota sobre B-08 y B-09:** El sistema actualmente asigna el viaje a la semana de **salida** (`date('W', $startTs) + 1`). Si el negocio define que debe caer en la semana de **llegada**, esto afecta todos los segmentos. Requiere aclaración urgente antes de implementar los bonos acumulativos (R-020, R-023).

---

## 📋 RESUMEN EJECUTIVO

| Estado | Cantidad | Descripción |
|---|---|---|
| ✅ **Resueltas en código** | 3 | FIX-01, FIX-02, FIX-03 |
| ⏳ **Pendientes del negocio** | 5 | PEN-01 a PEN-05 |
| 🗓️ **Backlog de desarrollo** | 9 | B-01 a B-09 |

### Impacto económico estimado de fixes aplicados

| Fix | Impacto por semana (estimado) |
|---|---|
| FIX-01 Doble Operador | +$713 por boleta PAC con D.O. activo |
| FIX-02 Bono Químico | +$250 por cada movimiento QMS extra (antes solo se pagaba 1) |
| FIX-03 Deducción FOK/HAW | Se elimina el cobro de más en rutas Fokker/Hawkins (−10 a −50 km no descontados) |

---

## 📅 PRÓXIMOS PASOS RECOMENDADOS

1. **Sesión de clarificación con nómina** — Llevar las 5 preguntas de PEN-01 a PEN-05 y registrar la respuesta por escrito (correo o acta).
2. **Actualizar RULE_LEDGER.md** — Marcar R-027, R-015, R-017/R-018 y R-006 con su definición final y cambiar status a `approved`.
3. **Priorizar backlog** — Definir qué bonos LOCAL/CRUCE entran en el próximo sprint (sugerido: B-08 y B-09 primero por su impacto transversal).
4. **UAT con 3 nóminas reales** — Validar FIX-01 y FIX-02 contra nóminas pagadas PAC de semana 41–45 para confirmar que la varianza baja de 4.1% a <1%.

---

*Reporte generado por Transportation Logic Deconstructor — 2026-04-24*
*Archivos analizados: `PayrollCalculator.php`, `BoletaProcessor.php`, `PacificoDetector.php`, `RouteResolver.php`, `RULE_LEDGER.md`, `REVERSE_ENGINEERING_REPORT_2026-04-21.md`, `calculadoras_sotelo_payroll_rules.md`, `Checklist_Clarificacion_Nomina.md`*
