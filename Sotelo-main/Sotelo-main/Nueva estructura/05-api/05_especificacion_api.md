# Especificación de la API

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 05 — Especificación de la API REST |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Depende de | [02_arquitectura_sistema](../02-arquitectura/02_arquitectura_sistema.md), [04_plan_de_seguridad](../04-seguridad/04_plan_de_seguridad.md) |

> API REST JSON de CodeIgniter 4. **El cliente nunca es de fiar:** toda autorización se evalúa server-side por permiso. Las rutas actuales `/api/*` se conservan y se migran con compatibilidad hacia `/api/v1/*`.

---

## 1. Convenciones

| Aspecto | Regla |
|---|---|
| Base URL | `/api/v1/` (nuevas); `/api/*` (legacy, en transición) |
| Formato | JSON en request y response; `Content-Type: application/json` |
| Autenticación | `Authorization: Bearer <access_jwt>` |
| Autorización | Por **permiso** (filtros CI4); denegación por defecto |
| Métodos/estados | GET 200 · POST 201 · PUT/PATCH 200 · DELETE 204 · 4xx/5xx con cuerpo de error |
| Paginación | `?page=N&per_page=M` o cursor en listados grandes (auditoría, liquidaciones) |
| CORS | Restringido al origen del frontend (`Config/Cors.php`) |

### Formato de error estándar (estilo RFC 7807)

```json
{
  "type": "validation_error",
  "title": "Datos inválidos",
  "status": 422,
  "detail": "El campo diesel_por_viaje debe ser numérico",
  "errors": { "diesel_por_viaje": ["numérico requerido"] }
}
```

Códigos típicos: `401` sin token / token inválido · `403` sin permiso · `404` no encontrado · `409` conflicto de estado · `422` validación.

---

## 2. Autenticación

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/api/v1/auth/login` | público | `{email, password}` → `{access, refresh, user}` |
| POST | `/api/v1/auth/refresh` | público (con refresh) | rota el refresh y emite nuevo access |
| POST | `/api/v1/auth/logout` | autenticado | revoca el refresh token |
| GET | `/api/v1/auth/me` | autenticado | usuario actual + roles + permisos |

---

## 3. Nómina (carga, cálculo, liquidaciones)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/api/v1/upload` | `liquidacion.upload` | **sube CSV de Genesis (solo Admin)** → devuelve trips/boletas estructurados |
| POST | `/api/v1/calculate` | `liquidacion.calculate` | recalcula una boleta/viaje (fuente única de total) |
| GET | `/api/v1/liquidaciones` | `liquidacion.view` | lista (filtro por **rango de fechas**, estado, unidad) |
| GET | `/api/v1/liquidaciones/{id}` | `liquidacion.view` | detalle con boletas y viajes |
| GET | `/api/v1/mis-viajes` | `liquidacion.view.own` | **seguimiento de los viajes PROPIOS del conductor** (Operador); el backend filtra por su identidad (unidad/operador), nunca por parámetro del cliente |
| POST | `/api/v1/liquidaciones` | `liquidacion.edit` | crea/guarda borrador |
| PUT | `/api/v1/liquidaciones/{id}` | `liquidacion.edit` | edita (solo en BORRADOR) |
| POST | `/api/v1/liquidaciones/{id}/enviar` | `liquidacion.edit` | BORRADOR → PENDIENTE |
| POST | `/api/v1/liquidaciones/{id}/aprobar` | `liquidacion.approve` | PENDIENTE → APROBADA |
| POST | `/api/v1/liquidaciones/{id}/rechazar` | `liquidacion.reject` | PENDIENTE → BORRADOR (con motivo) |
| POST | `/api/v1/liquidaciones/{id}/cerrar` | `liquidacion.close` | APROBADA → CERRADA |

> Filtro por rango de fechas (ADR-008): `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`. `semana_nomina` se devuelve solo como dato informativo.

---

## 4. Catálogos (lectura)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/v1/catalogs/rendimientos` | `catalog.view` |
| GET | `/api/v1/catalogs/rutas` | `catalog.view` |
| GET | `/api/v1/catalogs/keywords` | `catalog.view` |
| GET | `/api/v1/tabulador` | `catalog.view` |
| GET | `/api/v1/tabulador/versiones` | `catalog.view` |

---

## 5. Administración (CRUD)

| Recurso | Rutas | Permiso |
|---|---|---|
| Tabulador | `GET/POST/PUT/DELETE /api/v1/admin/tabulador[/{id}]`, `/upload`, `/activar`, `/desactivar` | `catalog.tabulador.manage` |
| Rutas | `… /api/v1/admin/rutas[/{id}]` | `catalog.rutas.manage` |
| Keywords | `… /api/v1/admin/keywords[/{id}]` | `catalog.keywords.manage` |
| Unidades (rendimiento) | `… /api/v1/admin/unidades[/{id}]` | `catalog.unidades.manage` |
| **Exclusiones de pago base** | `… /api/v1/admin/exclusiones[/{id}]` | `catalog.exclusiones.manage` |
| Usuarios | `… /api/v1/admin/usuarios[/{id}]`, asignar roles | `user.manage` |
| Roles | `… /api/v1/admin/roles[/{id}]` | `role.manage` |
| Auditoría | `GET /api/v1/admin/audit-logs` | `audit.view` |

---

## 6. Matriz de trazabilidad (resumen)

| Ajuste / Regla | Endpoint(s) | Permiso | Prueba |
|---|---|---|---|
| Ajuste 1/4 (diésel por viaje, total) | `/calculate` | `liquidacion.calculate` | `testTotalIncluyeDieselAFavor`, `testDieselPorViaje…` |
| Ajuste 2 (dedupe cruce) | `/upload`, `/calculate` | — | `testCruceSePagaUnaVez` |
| Ajuste 3 (exclusiones) | `/admin/exclusiones` | `catalog.exclusiones.manage` | `testExclusionTriGt…` |
| Ajuste 5 (rango fechas) | `/liquidaciones?start_date&end_date` | `liquidacion.view` | `testRangoFechas…` |
| Flujo de aprobación | `/liquidaciones/{id}/{aprobar,rechazar,cerrar}` | `liquidacion.approve/…` | `testOperadorNoPuedeAprobar403` |

> Mapeo completo de pruebas en el documento 06; reglas de negocio en 01b; modelo de datos en 03.
