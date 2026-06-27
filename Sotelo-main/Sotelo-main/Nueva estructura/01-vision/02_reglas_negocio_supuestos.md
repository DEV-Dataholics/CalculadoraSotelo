# Reglas de Negocio y Supuestos Bloqueantes

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 01b — Reglas de Negocio y Supuestos |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Autor | David García |
| Fuente | `Sotelo-main/importante/02_reglas_negocio/RULE_LEDGER.md`, *Ajustes Sotelo* |

---

**Propósito:** consolidar las decisiones de negocio que **deben cerrarse antes de codificar la Fase 2** (lógica de cálculo). Mientras no se confirmen, cada una se trata como **supuesto explícito** con el valor más probable (según `RULE_LEDGER.md` y nóminas reales) y su **criterio de validación**.

> ⚠️ Regla operativa: **no se cierra ni despliega una nómina real** sobre cálculos que dependan de un supuesto no confirmado. Los tests se parametrizan con el valor supuesto; al confirmarse, solo se ajusta el dato esperado.

---

## Cómo usar este documento

Cada decisión tiene: **pregunta al cliente**, **supuesto vigente** (lo que asumimos hoy), **evidencia**, **impacto si el supuesto es incorrecto**, y **cómo se valida**. Las decisiones alimentan las historias B-2, B-3, B-4 del backlog y los tests del Plan de Pruebas.

---

## Decisión 1 — Definición exacta del "Total de la boleta" 🔴 BLOQUEANTE

**Pregunta al cliente:** el total debe ser *pago base + diésel a favor*. ¿Los **cruces** y **bonos** van **dentro** del pago base, o son **sumandos aparte** del total? Se requiere un **ejemplo numérico real** de una boleta correcta.

**Supuesto vigente:** `Total_Pay = pago_base + diésel_a_favor + pago_cruce + bonos`, donde "pago base" es el pago por km/pierna (FCH $110/$55 o PAC km×tarifa), y cruces y bonos son **sumandos aparte**. Es lo que hoy implementa `PayrollCalculator.php` salvo que el diésel a favor está neutralizado (`+= 0.0`).

**Evidencia:** `RULE_LEDGER` F-001 → en nóminas FCH pagadas se cumple `TOTAL = PAGO POR KM + DIESEL A FAVOR + CRUCES + BONOS + ESTANCIAS − DEDUCCIONES`. Esto respalda que son sumandos separados.

**Impacto si es incorrecto:** define la fórmula raíz del sistema; un malentendido aquí desvía **todos** los totales.

**Validación:** reconstruir 3–5 boletas reales del set de control y verificar coincidencia $0.00 con el total pagado. El ejemplo numérico del cliente es el árbitro final.

---

## Decisión 2 — Valor del Bono Doble Operador 🔴 BLOQUEANTE

**Pregunta al cliente:** ¿el Bono Doble es **$1,726** o **$2,439**? Hoy conviven ambos: `BoletaCard.jsx` usa $1,726, el backend usa **$2,439**.

**Supuesto vigente:** **$2,439** (Aptiv Guamúchil, R-018, confidence 86). Evidencia: en nóminas pagadas `DOBLE OPERADOR = 4878 = 2,439 × 2`. El $1,726 (R-017, Obregón) es candidato no confirmado (confidence 64).

**Evidencia:** `RULE_LEDGER` R-017 vs R-018 y sección H (reverse engineering).

**Impacto si es incorrecto:** diferencia de $713 por evento en boletas PAC con doble operador. Es además el caso testigo de la divergencia frontend↔backend (R03).

**Matiz a confirmar:** ¿existe un caso real donde aplique $1,726 (Obregón) **en vez de** $2,439 (Guamúchil/Aptiv)? Si ambos existen, la regla debe **distinguir por ruta/cliente**, no elegir un único valor.

**Validación:** localizar en nóminas reales todos los eventos "DOBLE OPERADOR" y confirmar si todos son 2,439×n o si hay 1,726.

---

## Decisión 3 — Regla exacta de deduplicación de cruce 🔴 BLOQUEANTE

**Pregunta al cliente:** ¿el pago de cruce se registra **una vez por boleta**, **una vez por cruce físico**, o **una vez por folio/coordenada**?

**Supuesto vigente:** **una vez por cruce físico** (un cruce real suele venir como ≥2 filas: ida + retorno por PRECOS/Zaragoza; se paga 1 sola vez). Además, el **nivel 3** del `TabuladorModel` (tipo solo) **no** debe asignar tarifa de cruce a movimientos locales.

**Evidencia:** `PLAN_AJUSTES` Ajuste 2 + `RULE_LEDGER` R-006 (cruce se paga por separado, $500 equivalente). El dobleteo actual viene de acumular `pago_operador` por cada fila.

**Impacto si es incorrecto:** sobre-pago ($500 × filas) o sub-pago de cruces; es uno de los dos errores que el cliente reportó explícitamente.

**Validación:** SPIKE-1 — tomar boletas reales que dobleteaban y confirmar el número correcto de pagos de cruce contra el Excel pagado. Definir la **clave de agrupación** (¿por par de coordenadas? ¿por folio? ¿por boleta?) a partir de esos casos.

---

## Decisión 4 — Lista definitiva de exclusiones de pago base 🔴 BLOQUEANTE

**Pregunta al cliente:** ¿cuál es la **lista completa** de coordenadas y rutas que **no** deben sumar pago base? Confirmadas hasta ahora: **Tri** (cruce), **GT**, y rutas base **Zaragoza DTR** y **Fletes Sotelo**. ¿Hay más?

**Supuesto vigente:** sembrar `exclusiones_pago_base` con esas 4 entradas y dejar el catálogo **administrable** para que el cliente agregue las que falten sin tocar código (ADR-006).

| valor | tipo_match | nota |
|---|---|---|
| TRI | COORDENADA | cruce, no paga base |
| GT | COORDENADA | no paga base |
| ZARAGOZA DTR | RUTA | ruta base local |
| FLETES SOTELO | RUTA | ruta base (patio) |

**Evidencia:** `PLAN_AJUSTES` Ajuste 3 + *Ajustes Sotelo* punto 3.

**Impacto si es incorrecto:** se paga base ($110/$55) a conceptos que no lo llevan → sobre-pago. Mitigado por ser catálogo editable, pero la lista inicial debe ser correcta.

**Validación:** revisar contra el histórico qué coordenadas/rutas reciben base hoy y no deberían; confirmar la lista con nómina.

---

## Otras reglas relevantes ya resueltas (no bloqueantes, contexto)

Estas provienen del `RULE_LEDGER.md` y se respetan tal cual; se listan para trazabilidad.

| Regla | Definición | Estado |
|---|---|---|
| D-001 | Solo trips Genesis "Terminado"/"Completo" pasan a nómina | approved |
| D-002 | Filtrar por **número de unidad**, no por nombre de operador | approved |
| D-005 | Usar **km tabulados** (tabla de rutas), nunca el odómetro | approved |
| R-001/002 | FCH cargado $110 / vacío $55 por pierna | approved |
| R-004/005 | PAC cargado km×$0.30 / vacío km×$0.15 | approved |
| R-010 | Litros permitidos = km / rendimiento, **5 decimales** | manual-only |
| R-016 | Bono Sierra (PAC) $500 | approved |
| R-026/027 | Estancia Obregón $600/24h; Mochis $300/6h (granularidad a confirmar, OQ-3) | approved/testing |
| §B | Diésel y bono de desempeño son **manual-only** (no auto-cálculo) | política vigente |

> Nota: el diésel a favor es **manual-only** (capturado manualmente por el **Admin** al operar la nómina), pero **sí entra al total** una vez capturado (Decisión 1 + Ajuste 1). "Manual-only" significa que el motor no lo **calcula** automáticamente, no que se excluya del total.

---

## Preguntas abiertas heredadas del RULE_LEDGER (menor prioridad)

Estas no bloquean el arranque pero conviene cerrarlas durante Fase 2:

- **OQ-3:** Estancia Mochis ¿$300 por bloque de 6h o por noche?
- **OQ-4:** ¿Cuándo aplica Obregón $1,726 vs Guamúchil $2,439? (liga a Decisión 2)
- **OQ-6:** Ventana de agregación del Bono de Producción (suma de decimales ≥20).

---

## Resumen para el cliente (lo que necesitamos de Fletes Sotelo)

1. **Un ejemplo numérico real** de una boleta correcta (Decisión 1).
2. Confirmar **Bono Doble: $1,726 o $2,439** (y si ambos aplican, bajo qué ruta/cliente) (Decisión 2).
3. Aclarar **cómo se cuenta un cruce** para pagarlo una sola vez (Decisión 3).
4. La **lista completa de exclusiones** de pago base (Decisión 4).
5. Acceso a **nóminas reales pagadas** como set de control para validar el 100% de coincidencia.
