# Plan de Migración No Destructivo (MySQL · CodeIgniter 4)

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 03b — Plan de Migración |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Autor | David García |
| Depende de | [03_modelo_de_datos](03_modelo_de_datos.md), ADR-002, ADR-007 |

> **Regla de oro:** ninguna migración borra ni reescribe datos en uso. Todo es **aditivo, reversible y verificado en BD de prueba antes de producción.**

---

## 1. Estrategia general

Patrón **expand → migrate → contract**:

1. **Expand:** agregar tablas y columnas nuevas (NULL/DEFAULT). El sistema sigue funcionando igual.
2. **Migrate:** poblar lo nuevo (backfill) y activar doble escritura (legacy JSON + tablas normalizadas).
3. **Contract:** una vez verificado, dejar de escribir el camino legacy y, en una migración posterior y separada, retirar lo obsoleto.

Cada migración CI4 implementa `up()` y `down()` reales (rollback probado).

---

## 2. Orden de migraciones

| Orden | Migración | Tipo | Fase |
|---|---|---|---|
| M1 | `AddUserIdToAuditLogs` (+ before/after json) | Aditiva | 1 |
| M2 | `CreateUsers` | Nueva tabla | 1 |
| M3 | `CreateRoles`, `CreatePermissions` | Nuevas | 1 |
| M4 | `CreateRolePermissions`, `CreateUserRoles` | Nuevas (FK) | 1 |
| M5 | `CreateRefreshTokens` | Nueva (FK) | 1 |
| M6 | `AlterLiquidacionesAddEstadoYRango` (estado, created_by, approved_by, start/end_date, total_general) | Aditiva | 1 |
| M7 | `CreateBoletas`, `CreateViajes` | Nuevas (FK) | 1–2 |
| M8 | `CreateExclusionesPagoBase` | Nueva | 2 |
| M9 | `CreateCatalogVersions` (opcional) | Nueva | 2–3 |
| M10 | `BackfillLiquidacionesNormalizadas` (data migration) | Datos | 2 |
| M11 | `DropDatosBoletaJson` (solo tras verificación) | **Contract** | post-2 |

> M11 se ejecuta **únicamente** cuando la normalización esté verificada contra el histórico. Hasta entonces, `datos_boleta_json` permanece como snapshot de auditoría.

---

## 3. Backfill (M10) — de JSON a tablas normalizadas

```
Para cada fila de `liquidaciones` con datos_boleta_json:
  1. Parsear el JSON (lista de trips).
  2. Por cada trip → INSERT en `boletas` (unidad, operador, is_pacifico, totales).
  3. Por cada Row del trip → INSERT en `viajes` (origen, destino, tipo, cruce, kms, ...).
  4. Validar: SUM(viajes.pago_por_km) y totales reconstruidos == valores del JSON.
  5. Registrar discrepancias en un reporte; NO borrar el JSON.
```

El backfill es **idempotente** (puede re-ejecutarse) y produce un **reporte de conciliación** (cuántas liquidaciones migraron exactas vs con diferencia).

---

## 4. Doble escritura durante la transición

Mientras coexisten ambos modelos:

- `SessionController::save` y el flujo de cálculo escriben **a la vez** el snapshot JSON (compat) y las tablas normalizadas.
- Las lecturas nuevas (panel, reportes) usan tablas normalizadas; el flujo legacy sigue leyendo JSON hasta su retiro.
- Un *feature flag* (`Config` o variable de entorno) permite alternar la fuente de lectura para validar sin riesgo.

---

## 5. Procedimiento de despliegue de migraciones

```bash
# 1. BD de prueba (Docker) — siempre primero
php spark migrate
php spark db:seed RolesPermisosSeeder
php spark db:seed AdminUserSeeder
php composer test            # la suite debe quedar verde

# 2. Rollback de verificación (probar down())
php spark migrate:rollback
php spark migrate            # re-aplicar

# 3. Producción (Fase 5, con backup previo verificado)
#    - Snapshot restaurable de la BD productiva
#    - Ventana de mantenimiento corta
php spark migrate            # solo aditivas; sin DROP en este corte
#    - Verificar integridad y conciliación
#    - DROP (M11) en un despliegue posterior, ya verificado
```

---

## 6. Seguridad de la operación

| Salvaguarda | Detalle |
|---|---|
| Backup previo verificado | Antes de cualquier migración en producción; rollback probado |
| Migraciones reversibles | `down()` implementado y probado en BD de prueba |
| Sin DROP en el corte inicial | Las columnas/tablas obsoletas se retiran en un despliegue posterior |
| Conciliación obligatoria | Reporte de backfill comparando totales antes/después |
| Feature flag de lectura | Permite volver a leer del JSON si algo falla |
| Auditoría | Toda mutación de catálogos/liquidaciones queda en `audit_logs` con `user_id` |

---

## 7. Criterios de aceptación de la migración

- [ ] `php spark migrate` y `migrate:rollback` funcionan sin error en BD de prueba.
- [ ] La suite PHPUnit queda verde tras migrar y sembrar.
- [ ] El backfill concilia el 100% de las liquidaciones de control (o reporta y explica cada diferencia).
- [ ] El flujo actual (upload→calculate→save) sigue funcionando durante la doble escritura.
- [ ] En producción: backup verificado + migraciones aditivas aplicadas sin pérdida de datos.
