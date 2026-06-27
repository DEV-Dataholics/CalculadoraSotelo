# ADR-003 — Backend como fuente única de verdad del cálculo

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Fecha | 2026-06-11 |
| Autores | David García |
| Relacionado | [06_plan_de_pruebas](../06-pruebas/06_plan_de_pruebas.md), [02_reglas_negocio_supuestos](../01-vision/02_reglas_negocio_supuestos.md) |

## Contexto

`BoletaCard.jsx` recalcula totales con fórmulas propias que ya divergen del backend (Bono Doble $1,726 en frontend vs $2,439 en backend, regla R-018 validada).

## Decisión

Toda la matemática de nómina vive en `Libraries` del backend. El frontend **solo muestra** `Total_Pay` del backend; se elimina el recálculo local.

## Consecuencias

- (+) Una sola implementación que probar y auditar; se elimina la clase de bug por divergencia.
- (+) Cambios de reglas se hacen en un solo lugar.
- (−) Cada edición en UI requiere round-trip a `/api/calculate` para reflejar el total (ya existe el endpoint). UX: mostrar estado de "recalculando".
