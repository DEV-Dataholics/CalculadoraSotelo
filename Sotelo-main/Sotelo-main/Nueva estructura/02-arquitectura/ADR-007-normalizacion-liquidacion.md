# ADR-007 — Normalización de la nómina: liquidación → boleta → viaje

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Fecha | 2026-06-11 |
| Autores | David García |
| Relacionado | [03_modelo_de_datos](../03-datos/03_modelo_de_datos.md), [03b_plan_migracion](../03-datos/03b_plan_migracion.md) |

## Contexto

Hoy la liquidación se guarda como JSON (`datos_boleta_json` en `LiquidacionModel`). Dificulta consultas, integridad y reportes.

## Decisión

Normalizar a `liquidaciones` (cabecera) → `boletas` → `viajes` (filas), conservando un snapshot JSON por compatibilidad/auditoría durante la transición.

## Consecuencias

- (+) Consultas, reportes y validaciones por viaje; integridad referencial.
- (+) Habilita el flujo de aprobación por estados.
- (−) Migración de datos existentes; se hace aditiva con doble escritura temporal (ver plan de migración).
