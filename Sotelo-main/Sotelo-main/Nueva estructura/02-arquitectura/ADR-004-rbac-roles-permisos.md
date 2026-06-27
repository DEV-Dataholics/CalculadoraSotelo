# ADR-004 — RBAC con roles + permisos (no roles hardcodeados)

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Fecha | 2026-06-11 |
| Autores | David García |
| Relacionado | [04_plan_de_seguridad](../04-seguridad/04_plan_de_seguridad.md) |

## Contexto

No existe control de acceso. Se requieren 4 roles (Admin, Operador, Supervisor/Aprobador, Auditor) y posiblemente más a futuro.

## Decisión

Modelo **RBAC** con tablas `users`, `roles`, `permissions`, `role_permissions`, `user_roles`. La autorización se evalúa por **permiso**, no por nombre de rol, en Filters de CI4. Denegación por defecto. Detalle en el doc 04.

## Consecuencias

- (+) Extensible: añadir un rol = nueva fila + asignación de permisos, sin tocar código.
- (+) Permite permisos finos (p. ej. "aprobar liquidación") y roles compuestos.
- (−) Más tablas y un seed inicial de permisos. Justificado por el requisito de control.
