# Informe de Diferencias de Lógica de Nómina
> **Agente:** Transportation Logic Deconstructor  
> **Fecha:** 2026-04-21  
> **Scope:** Nóminas FCH (Foráneo Chihuahua) y PAC (Foráneo Pacífico) — *diesel y bonos manuales excluidos del análisis*  
> **Archivos analizados:** `REVERSE_ENGINEERING_REPORT_2026-04-21.md`, `RULE_LEDGER.md`, `calculadoras_sotelo_payroll_rules.md`, `Checklist_Clarificacion_Nomina.md`, `PayrollCalculator.php`, `BoletaProcessor.php`, `PacificoDetector.php`, `RouteResolver.php`, `BoletaCard.jsx`

---

## 1. Resumen de Coincidencias ✅

Las siguientes reglas están **operando correctamente** en la aplicación (sin necesidad de ajuste):

| Regla | Descripción | Fuente | Estado |
|---|---|---|---|
| **R-001** | FCH Leg Cargado → $110.00 flat por pierna | `BoletaProcessor.php:108` | ✅ Correcto |
| **R-002** | FCH Leg Vacío → $55.00 flat por pierna | `BoletaProcessor.php:108` | ✅ Correcto |
| **R-016** | PAC Bono Sierra → $500.00 (manual toggle) | `PayrollCalculator.php:97-98` | ✅ Correcto |
| **R-026** | PAC Estancia Obregón → $600 × noches | `PayrollCalculator.php:102` | ✅ Correcto |
| **R-027** | PAC Estancia Mochis → $300 × bloques | `PayrollCalculator.php:103` | ✅ Correcto (granularidad pendiente — OQ-3) |
| **D-001** | Solo trips con status FACTURADO/COMPLETO avanzan a nómina | `BoletaProcessor.php:65` | ✅ Correcto (parcial — ver D-08) |
| **D-005** | Se usan km tabulados (RouteResolver), no odómetro | `RouteResolver.php` | ✅ Correcto — con fallback al CSV |

---

## 2. Matriz de Discrepancias ⚠️

### DISCREPANCIA D-01 — FCH: Tasa km expresada como valor plano, no como `km × tasa`

| Atributo | Detalle |
|---|---|
| **Concepto / Regla** | R-001 / R-002 — Tasa FCH Cargado y Vacío |
| **"Deber Ser"** (`calculadoras_sotelo`) | FCH Cargado: `km × 0.29333` · FCH Vacío/PT: `km × 0.14666` |
| **Resultado en la App** | `BoletaProcessor.php:108` usa **unidades planas**: $110 y $55 por **leg completo**, sin multiplicar por km |
| **Ubicación de la falla** | `backend/app/Libraries/BoletaProcessor.php`, línea 108 |

> **Diagnóstico:** El documento `calculadoras_sotelo_payroll_rules.md` expresa la tasa como `km × 0.29333 ≈ $110 para 375km estándar`. La app asume que **cada pierna FCH vale exactamente $110/$55 sin importar la distancia real**. Esto es correcto **solo si todas las piernas FCH son de la ruta estándar 375 km**. Para rutas con distancia diferente, la tasa plana generará un error sistemático.
>
> **Impacto:** Piernas FCH no estándar serán **sobreestimadas o subestimadas** según la distancia real vs. 375 km.
>
> **Confianza del diagnóstico:** Alta (90).

---

### DISCREPANCIA D-02 — PAC: Doble Operador usa $1,726 en lugar de $2,439 ⚠️ CRÍTICA

| Atributo | Detalle |
|---|---|
| **Concepto / Regla** | R-017 vs R-018 — Bono Doble Operador PAC |
| **"Deber Ser"** (`calculadoras_sotelo` + paid data) | `Bono_Doble = $2,439` (Guamúchil/Aptiv). Nóminas pagadas semanas 41-45 confirman monto 4,878 = $2,439 × 2. |
| **Resultado en la App** | `PayrollCalculator.php:100` y `BoletaCard.jsx:85` aplican **$1,726.00** al activar el toggle Bono Doble |
| **Ubicación de la falla** | `backend/app/Libraries/PayrollCalculator.php` línea 100 · `frontend/src/components/BoletaCard.jsx` línea 85 |

> **Diagnóstico:** La aplicación usa la tasa de Doble Operador Obregón ($1,726 — R-017, confianza 64, estado `candidate`). Sin embargo, los datos reales de nóminas pagadas muestran $4,878 = $2,439 × 2, confirmando que la tasa activa en producción es la de Guamúchil/Aptiv (**R-018: $2,439**).
>
> **Impacto:** Total PAC con Bono Doble activo tendrá **$713 menos** al real por cada aplicación ($2,439 − $1,726 = $713).
>
> **Confianza del diagnóstico:** Alta (86). Validado por nóminas pagadas.

---

### DISCREPANCIA D-03 — FCH: Cruce ELP solo detecta 2 de 6 combinaciones + deducción incorrecta para FOK/HAW

| Atributo | Detalle |
|---|---|
| **Concepto / Regla** | R-013 — Deducción km por cruce internacional |
| **"Deber Ser"** | `calculadoras_sotelo`: código 4=ELP (−40km), código 5=FOK/HAW (−50km), código 6=FOK/HAW+ELP (−90km) |
| **Resultado en la App** | `BoletaProcessor.php:94-102` sólo detecta: (1) `EL PASO→{JRZ/RIO BRAVO/ZARAGOZA}` y (2) inversa. Aplica siempre **−40 km** independientemente del tipo de cruce. No hay lógica para códigos 5 o 6. |
| **Ubicación de la falla** | `backend/app/Libraries/BoletaProcessor.php`, líneas 94-102 |

> **Diagnóstico:** Cruces FOK/HAW (código 5: −50km) y FOK/HAW+ELP (código 6: −90km) no están implementados. La app siempre descuenta −40km para cualquier cruce detectado, lo cual es incorrecto para los códigos 5 y 6.
>
> **Impacto:** Rutas FOK/HAW tendrán km pagados incorrectos (−40 en lugar de −50 o −90).
>
> **Confianza del diagnóstico:** Alta (88).

---

### DISCREPANCIA D-04 — Frontend: `calculateDependentFields` calcula Diesel automáticamente (viola política manual-only) ⚠️ CRÍTICA

| Atributo | Detalle |
|---|---|
| **Concepto / Regla** | Política manual-only diesel (R-008 a R-011) |
| **"Deber Ser"** | Diesel no debe auto-calcularse. El campo de diesel es de captura manual. |
| **Resultado en la App** | `BoletaCard.jsx:35-61`: `calculateDependentFields` calcula `Litros_A_Pago = (totalKms / rendPago) - recarga` y `Diesel_A_Favor = litrosPago × precioDisel`. Esto se ejecuta automáticamente al cambiar KMS o Recarga. `recalcAndNotify:79` suma `dieselIncentive` al `Incentive_Pay` enviado al padre. |
| **Ubicación de la falla** | `frontend/src/components/BoletaCard.jsx`, líneas 35-61, 79, 91 |

> **Diagnóstico:** Si un operador ingresa Recarga en el campo (aunque sea para referencia), el frontend calcula automáticamente `Litros_A_Pago`, `Diesel_A_Favor` y los suma al `Incentive_Pay`. Esto viola la política `manual-only` establecida en el RULE_LEDGER.
>
> **Impacto:** El `Total_Pay` mostrado en UI puede incluir diesel calculado automáticamente, inflando el total.
>
> **Confianza del diagnóstico:** Alta (92).

---

### DISCREPANCIA D-05 — PAC: `PacificoDetector` sin fallback hardcodeado de keywords

| Atributo | Detalle |
|---|---|
| **Concepto / Regla** | Detección de segmento PAC |
| **"Deber Ser"** (`calculadoras_sotelo`) | Keywords: OBRG, OBREGON, MOCHIS, GUAMUCHIL, NAVOJOA, CANANEA, ETCHO, JANOS, NOGALES, HERMOSILLO, EMPALME, BACUM, GYSA, YARDA SOTELO |
| **Resultado en la App** | `PacificoDetector.php` lee keywords **solo desde BD** (`pacifico_keywords`). Si la tabla está incompleta, la detección falla silenciosamente. No hay fallback en código. |
| **Ubicación de la falla** | `backend/app/Libraries/PacificoDetector.php`, líneas 15-21 |

> **Diagnóstico:** Un trip PAC mal clasificado como FCH recibirá $110/$55 por pierna en lugar de `km × $0.30/$0.15`, generando errores significativos.
>
> **Confianza del diagnóstico:** Media-alta (78). Depende del estado de la tabla BD.

---

### DISCREPANCIA D-06 — PAC: Tasa única por boleta en lugar de tasa por pierna ⚠️ CRÍTICA

| Atributo | Detalle |
|---|---|
| **Concepto / Regla** | R-004 / R-005 — PAC Base Pay por pierna C/V |
| **"Deber Ser"** | `Base_Pay = sum(km_pierna × tasa_C_o_V)` — cada pierna usa su propia condición de carga |
| **Resultado en la App** | `BoletaProcessor.php:107` no acumula basePay para PAC. `PayrollCalculator.php:92-93` aplica **una única tasa** (`Manual_Pac_Loaded`) a todos los km totales de la boleta. |
| **Ubicación de la falla** | `backend/app/Libraries/PayrollCalculator.php`, líneas 92-93 · `BoletaProcessor.php`, línea 107 |

> **Diagnóstico:** Si una boleta PAC incluye piernas cargadas y retorno vacío, la tasa uniforme será incorrecta en cualquiera de las dos selecciones disponibles.
>
> **Impacto probable:** Correlaciona con el 9.5% de error en PAC (6/63 boletas) documentado en `calculadoras_sotelo`.
>
> **Confianza del diagnóstico:** Alta (85).

---

### DISCREPANCIA D-07 — `RouteResolver`: `ZARAGOZA` no está normalizado como punto de cruce

| Atributo | Detalle |
|---|---|
| **Concepto / Regla** | R-013 — Cruce Zaragoza |
| **"Deber Ser"** | `ZARAGOZA` es un puente de cruce internacional que requiere deducción km |
| **Resultado en la App** | `RouteResolver.php:72` normaliza `EL PASO` y `RIO BRAVO` → `'EL PASO'`. `ZARAGOZA` no está normalizado, por lo que en la búsqueda de rutas tabuladas se usará el string exacto. Si no existe fila para `ZARAGOZA` en la tabla `rutas`, se usa el fallback (`$rowKms` del CSV). |
| **Ubicación de la falla** | `backend/app/Libraries/RouteResolver.php`, líneas 66-80 |

> **Confianza del diagnóstico:** Media (72). Depende del contenido de la tabla `rutas`.

---

### DISCREPANCIA D-08 — `BoletaProcessor`: No filtra statuses inválidos (trips EN TRÁNSITO o CANCELADOS)

| Atributo | Detalle |
|---|---|
| **Concepto / Regla** | D-001 — Solo `Terminado`/`Completo` avanzan a nómina |
| **"Deber Ser"** | Trips con cualquier otro status deben descartarse antes del cálculo |
| **Resultado en la App** | `BoletaProcessor.php` procesa **todos los rows del CSV** sin filtrar por status. Solo usa el status para determinar tipo de carga (FACTURADO=cargado, COMPLETO=vacío), pero no descarta EN TRÁNSITO/CANCELADO. |
| **Ubicación de la falla** | `backend/app/Libraries/BoletaProcessor.php`, inicio del loop `foreach $boletaRows` |

> **Confianza del diagnóstico:** Alta (82).

---

## 3. Variables Sombra (Shadow Variables) 👁️

| Variable | Efecto Probable | Estado en App |
|---|---|---|
| **Tipo de remolque** (plataforma vs. cerrado) | Activa Bono Amarres/Enlones (R-022) | No implementado |
| **Día de semana del viaje** | Bono Sábado $175 × decimales (R-023) | No implementado |
| **Horas de idle** en patio o cliente | Estancias LOCAL/CRUCE (R-024/R-025) | No implementado |
| **Cliente específico** | Puede activar Doble Operador o Bono Aduana (R-021) | No implementado |
| **Estado tabla `pacifico_keywords`** | Determina silenciosamente si se paga como PAC o FCH | BD — no validada |

---

## 4. Varianza Residual 📊

| Segmento | Validación Documentada | Gap Estimado | Causa Probable |
|---|---|---|---|
| **FCH** | 99.2% exacto (128/129 boletas) | <1% para rutas estándar | D-01 en rutas atípicas |
| **PAC** | 90.5% exacto (57/63 boletas) | ~9.5% (6 boletas) | D-06 (tasa única por boleta) |
| **FCH-Cruce** | No validado | Desconocido | D-03 (cobertura incompleta) |
| **LOCAL/CRUCE** | Tabla en disputa (R-006) | No evaluado | — |

---

## 5. Top 3 Correcciones de Mayor Impacto

1. **D-02** — Cambiar `$1,726` → `$2,439` en `PayrollCalculator.php:100` y `BoletaCard.jsx:85` para el Bono Doble Operador (una vez confirmado OQ-4 con el equipo de nómina).
2. **D-04** — Eliminar el cálculo automático de `Diesel_A_Favor` del `recalcAndNotify` del frontend para cumplir la política `manual-only`. El campo puede quedar visible como referencia, pero no debe sumarse al `Total_Pay`.
3. **D-06** — Evaluar si el cálculo PAC debe cambiar de "tasa única por boleta" a "tasa por pierna con toggle C/V por fila", para corregir el 9.5% de boletas con error documentado.

---

## 6. Preguntas Abiertas para Cierre

| # | Pregunta | Regla | Prioridad |
|---|---|---|---|
| **P-01** | ¿Las piernas FCH tienen siempre 375 km? ¿Hay piernas de distancia variable que requieran `km × 0.29333`? | D-01 | **ALTA** |
| **P-02** | ¿El toggle "Bono Doble" activa $1,726 u $2,439? ¿Puede pagarse dos veces en la misma boleta? | D-02, OQ-4 | **ALTA** |
| **P-03** | ¿FOK/HAW descuenta 50 km y FOK/HAW+ELP descuenta 90 km? ¿Cómo se identifica FOK/HAW en Genesis? | D-03 | **ALTA** |
| **P-04** | ¿El diesel calculado (`Litros_A_Pago × precio`) debe o no sumarse al `Total_Pay` automáticamente? | D-04 | **ALTA** |
| **P-05** | ¿Las boletas PAC pueden tener piernas mixtas (algunas cargadas, algunas vacías)? | D-06 | **MEDIA** |
| **P-06** | ¿Qué keywords están actualmente en la tabla `pacifico_keywords`? ¿Están las 14 documentadas? | D-05 | **MEDIA** |
| **P-07** | ¿La tabla `rutas` tiene entrada para `ZARAGOZA` como origen/destino? | D-07 | **BAJA** |
| **P-08** | ¿Qué statuses de Genesis deben filtrarse antes de calcular nómina? | D-08 | **MEDIA** |

---

```
COINCIDENCIAS CORRECTAS:   7 reglas
DISCREPANCIAS ENCONTRADAS: 8 diferencias
  - CRÍTICAS: D-02, D-03, D-04, D-06
  - MEDIANAS: D-01, D-05, D-08
  - MENORES:  D-07
```

*Generado por: Transportation Logic Deconstructor — Informe v1.0 — 2026-04-21*  
*Escala de confianza: 0-39 débil · 40-69 plausible · 70-84 sólido · 85-100 aprobado-listo*
