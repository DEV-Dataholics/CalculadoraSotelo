# ADR-008 — Filtrado por rango de fechas (no por semana ISO)

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Fecha | 2026-06-11 |
| Autores | David García |
| Relacionado | [02_reglas_negocio_supuestos](../01-vision/02_reglas_negocio_supuestos.md) (Ajuste 5), [07b_backlog](../07-roadmap/07b_backlog_user_stories.md) (B-5) |

## Contexto

Ajuste 5: las semanas rígidas (`Payroll_Week`) rompen viajes que cruzan periodos (foráneos que van de una semana ISO a otra).

## Decisión

Persistir `start_date`/`end_date` por viaje y filtrar por rango. `Payroll_Week` se conserva como dato informativo, no como criterio de cálculo.

## Consecuencias

- (+) Viajes foráneos que cruzan semanas se procesan completos.
- (−) El frontend cambia `PeriodSelector` a selector de rango; se ajustan filtros (`App.jsx`, `SummaryBar.jsx`).
