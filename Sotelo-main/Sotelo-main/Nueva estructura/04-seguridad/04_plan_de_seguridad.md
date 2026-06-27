# Plan de Seguridad — Roles, Permisos y Autenticación

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 04 — Plan de Seguridad (RBAC + Autenticación) |
| Versión | 1.0 |
| Estado | Propuesta — confirmar antes de iniciar Fase 1 |
| Fecha | 2026-06-11 |
| Autor | David García |
| ADR relacionados | ADR-004 (RBAC), ADR-005 (Auth JWT) |

> Lectura obligatoria antes de tocar cualquier flujo sensible. Cubre el modelo RBAC, la autenticación y los controles transversales (OWASP, auditoría, secretos). El detalle del catálogo de permisos y la matriz Rol×Permiso constituyen el núcleo de este plan.

## Controles transversales (resumen)

- **Autorización por objeto y por permiso**, denegación por defecto, evaluada server-side en Filters de CI4.
- **OWASP Top 10:** Query Builder/sentencias preparadas (sin concatenar SQL), `$allowedFields` en cada Model (anti mass-assignment), validación de entrada en backend, React auto-escapa (sin `dangerouslySetInnerHTML`).
- **Auditoría:** toda mutación de catálogo/liquidación se registra en `audit_logs` con `user_id`, antes/después e IP.
- **Secretos** solo por entorno (`.env`/secret manager), nunca versionados; credenciales de producción fuera del repo.
- **Hardening:** CORS restringido, headers de seguridad, rate limiting en rutas sensibles (Fase 5).

---

## Resumen

Propongo un modelo **RBAC** (Role-Based Access Control) con cuatro roles iniciales y autorización por **permiso**, más autenticación basada en **JWT de vida corta + refresh token**, para proteger toda la API y habilitar un flujo de aprobación de liquidaciones.

## Motivación

El sistema no tiene control de acceso: cualquiera con la URL puede subir CSV, recalcular pagos y editar catálogos que alimentan los cálculos. En un sistema de nómina esto es inaceptable (riesgo de fraude, error y fuga de datos). Se requieren roles diferenciados y trazabilidad.

---

## Roles

| Rol | Descripción | Capacidades clave |
|---|---|---|
| **Admin** | Administra y **opera** la nómina | **Carga el CSV de Genesis**, captura diésel/bonos por viaje, crea/edita/recalcula boletas; gestiona usuarios, roles, catálogos, exclusiones, reglas y auditoría |
| **Operador (conductor)** | Consulta su propio pago | **Solo lectura, acotado a sus propios viajes**: ve el seguimiento de sus viajes y su liquidación. **No** carga CSV, **no** captura, **no** edita, **no** aprueba |
| **Supervisor / Aprobador** | Control de calidad | Revisar, **aprobar/rechazar** y **cerrar** liquidaciones; editar y recalcular antes de aprobar |
| **Auditor** | Solo lectura (global) | Ver todas las liquidaciones, reportes y bitácora; **no** modifica nada |

> El rol **Operador** corresponde al **conductor** (el empleado que realiza los viajes y al que se le paga). Inicia sesión únicamente para dar seguimiento a sus propios viajes y conocer su pago; la operación de la nómina (carga y captura) la realiza el **Admin**.
> Los roles se evalúan por **permiso**, no por nombre, para permitir roles compuestos y futuros (p. ej. "Capturista" sin permisos de administración).

## Catálogo de permisos (inicial)

```
auth.login

# Liquidaciones / nómina
liquidacion.upload          subir CSV de Genesis (operación del Admin)
liquidacion.calculate       recalcular boleta
liquidacion.view            ver TODAS las liquidaciones
liquidacion.view.own        ver únicamente las liquidaciones/viajes PROPIOS (conductor)
liquidacion.edit            editar boletas/viajes (en borrador)
liquidacion.approve         aprobar
liquidacion.reject          rechazar
liquidacion.close           cerrar/liquidar

# Catálogos (cálculo)
catalog.view                leer catálogos
catalog.tabulador.manage    CRUD tabulador (con versiones)
catalog.rutas.manage        CRUD rutas/distancias
catalog.keywords.manage     CRUD keywords pacífico
catalog.unidades.manage     CRUD rendimientos de unidad
catalog.exclusiones.manage  CRUD exclusiones de pago base

# Administración
user.manage                 CRUD usuarios y asignación de roles
role.manage                 CRUD roles y permisos
audit.view                  ver bitácora de auditoría
```

## Matriz Rol × Permiso

| Permiso | Admin | Operador (conductor) | Supervisor | Auditor |
|---|:--:|:--:|:--:|:--:|
| auth.login | ✅ | ✅ | ✅ | ✅ |
| liquidacion.upload | ✅ | — | — | — |
| liquidacion.calculate | ✅ | — | ✅ | — |
| liquidacion.view (todas) | ✅ | — | ✅ | ✅ |
| liquidacion.view.own (propias) | — | ✅ | — | — |
| liquidacion.edit | ✅ | — | ✅ | — |
| liquidacion.approve | ✅ | — | ✅ | — |
| liquidacion.reject | ✅ | — | ✅ | — |
| liquidacion.close | ✅ | — | ✅ | — |
| catalog.view | ✅ | — | ✅ | ✅ |
| catalog.\*.manage | ✅ | — | — | — |
| user.manage | ✅ | — | — | — |
| role.manage | ✅ | — | — | — |
| audit.view | ✅ | — | ✅ | ✅ |

> Nota de diseño:
> - **Carga y captura** las realiza el **Admin** (`liquidacion.upload` es exclusivo de Admin).
> - **Aprobación/cierre** es del **Supervisor** — separar captura de aprobación es un control anti-fraude (segregación de funciones).
> - El **Operador (conductor)** solo tiene `liquidacion.view.own`: ve **sus propios** viajes/liquidación, sin capacidad de carga, captura ni aprobación. El backend debe **filtrar por la identidad del conductor** (su unidad/registro), nunca confiar en un parámetro del cliente.

## Flujo de estados de liquidación (habilitado por roles)

```
BORRADOR ──(Admin envía)──► PENDIENTE ──(Supervisor aprueba)──► APROBADA ──(Supervisor cierra)──► CERRADA
   ▲                                │
   └──────(Supervisor rechaza)──────┘
```
> El **Operador (conductor)** no participa en estas transiciones; únicamente consulta el resultado de **sus** viajes.

---

## Modelo de datos (resumen — detalle en doc 06)

```
users(id, nombre, email UNIQUE, password_hash, is_active, last_login_at,
      unidad NULL,          -- vincula al conductor con su unidad (rol Operador) para acotar "sus viajes"
      operador_ref NULL,    -- alternativa/complemento: nombre o clave del operador en Genesis
      timestamps, soft_delete)
roles(id, nombre UNIQUE, descripcion)
permissions(id, clave UNIQUE, descripcion)
role_permissions(role_id FK, permission_id FK)        -- PK compuesta
user_roles(user_id FK, role_id FK)                    -- PK compuesta
refresh_tokens(id, user_id FK, token_hash, expires_at, revoked_at, created_at)
```

---

## Autenticación: propuesta detallada

1. `POST /api/v1/auth/login {email, password}` → valida con `password_verify` (Argon2id) → emite **access JWT** (~15 min) + **refresh token** (persistido, ~7 días, rotable).
2. Cliente envía `Authorization: Bearer <access>` en cada request.
3. `AuthFilter` valida firma/expiración del JWT y carga el usuario + permisos.
4. `PermissionFilter('liquidacion.approve')` autoriza por permiso en cada ruta.
5. `POST /api/v1/auth/refresh {refresh}` → rota el refresh y emite nuevo access.
6. `POST /api/v1/auth/logout` → revoca el refresh.

### Filtros CI4 (registro en `Config/Filters.php`)

```php
$routes->group('api/v1/admin', ['filter' => 'permission:user.manage'], ...);
$routes->post('api/v1/liquidaciones/(:num)/aprobar', '...', ['filter' => 'permission:liquidacion.approve']);
```

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Sesión server-side + cookie** | Revocación simple, menos manejo de tokens | Requiere store de sesión compartido; fricción CORS con SPA en otro dominio |
| **JWT + refresh (propuesta)** | Encaja con SPA, stateless en access | Revocación necesita rotación de refresh |
| Roles hardcodeados en código | Rápido al inicio | No extensible, no auditable, anti-patrón |

## Decisión solicitada

1. ¿Confirmamos JWT + refresh, o se prefiere sesión con cookie? (Recomendado: JWT + refresh.)
2. ¿Los 4 roles son suficientes para el arranque? ¿Algún permiso adicional?
3. El **Operador (conductor)** solo consulta **sus propios** viajes (`liquidacion.view.own`). ¿Debe ver además su histórico de liquidaciones cerradas, o únicamente el periodo vigente?
4. ¿La identidad del conductor se resuelve por **unidad** (`users.unidad`), por **clave/nombre de operador** (`users.operador_ref`), o ambas? Define cómo se acota "sus viajes".

## Riesgos e impacto

- Impacto de desarrollo: incluido en Fase 1 (~2 semanas backend).
- Riesgo: revocación de tokens y expiración mal manejadas → mitigado con rotación de refresh y tests de auth.
