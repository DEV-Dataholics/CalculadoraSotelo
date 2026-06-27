# ADR-002 — Evolución incremental, no reescritura

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Fecha | 2026-06-11 |
| Autores | David García |
| Relacionado | [07_roadmap_fases](../07-roadmap/07_roadmap_fases.md), [03b_plan_migracion](../03-datos/03b_plan_migracion.md) |

## Contexto

Hay lógica de negocio crítica en producción y reglas validadas contra nóminas reales. Una reescritura arriesgaría regresiones de cálculo (= dinero mal pagado).

## Decisión

Reestructurar de forma **incremental**: migraciones aditivas/reversibles, conservar el motor legacy como fallback durante la transición, y extender (no reemplazar) el panel admin existente.

## Consecuencias

- (+) Cada fase es desplegable y reversible; se baja el riesgo.
- (+) Permite verificación contra nóminas reales en cada gate.
- (−) Coexistencia temporal de caminos legacy y moderno (ya presente: `Rows` vs legacy en `PayrollCalculator`). Se documenta y se retira al cerrar fases.
