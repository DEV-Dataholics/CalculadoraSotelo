# ADR-001 — Mantener MySQL como motor de base de datos

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Fecha | 2026-06-11 |
| Autores | David García |
| Relacionado | [02_arquitectura_sistema](02_arquitectura_sistema.md), [03_modelo_de_datos](../03-datos/03_modelo_de_datos.md) |

## Contexto

Se pidió una BBDD "más robusta". El stack actual es CI4 + MySQL. Se evaluó migrar a PostgreSQL o añadir Redis.

## Decisión

Mantener **MySQL** y robustecerlo (integridad referencial, normalización, índices, auditoría). No migrar de motor en esta reestructura.

## Consecuencias

- (+) Riesgo mínimo: sin migración de motor ni reconfiguración de CI4; el equipo ya conoce MySQL.
- (+) "Robusto" se logra con diseño, no con cambio de tecnología.
- (−) Se renuncia a features de PostgreSQL (tipos estrictos, vistas materializadas). Aceptable para el dominio.
- Redis queda como mejora futura opcional (caché de catálogos), fuera de scope.
