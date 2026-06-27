# Arquitectura del Sistema — Reestructura PayrollTool

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 02 — Arquitectura del Sistema |
| Versión | 1.0 |
| Estado | Propuesta de arquitectura objetivo (evolución del sistema actual) |
| Fecha | 2026-06-11 |
| Autor | David García |
| ADR relacionados | ADR-001 … ADR-008 (esta carpeta) |

---

## 1. Vista general

Arquitectura cliente-servidor desacoplada, ya presente en el repo y que se conserva:

```
┌─────────────────────────┐        HTTPS / JSON        ┌──────────────────────────────┐
│  Frontend (React 19)    │  ───────────────────────►  │  Backend API (CodeIgniter 4) │
│  Vite 7 + Tailwind 4    │  ◄───────────────────────  │  PHP 8.2                     │
│  SPA, build estático    │        REST + JWT          │  Controllers / Libraries     │
└─────────────────────────┘                            └──────────────┬───────────────┘
                                                                       │ Query Builder / Models
                                                                       ▼
                                                              ┌──────────────────┐
                                                              │   MySQL 8        │
                                                              │  (robustecida)   │
                                                              └──────────────────┘
```

- **Frontend:** SPA en React 19 + Vite + Tailwind. Build estático servible por cualquier web server/CDN. Consume la API por `fetch` (`src/api.js`).
- **Backend:** API REST en CI4. Capas: `Controllers` (HTTP) → `Libraries` (lógica de negocio pura) → `Models` (acceso a datos). La lógica de cálculo vive en `Libraries` y es **testeable sin BD** (ya se inyecta `TabuladorModel` opcional).
- **Datos:** MySQL como fuente única de verdad. Catálogos versionados y auditoría.

---

## 2. Backend (CodeIgniter 4) — organización objetivo

Se respeta la estructura existente y se añade la capa de identidad y la normalización de nómina.

```
backend/app/
├── Controllers/
│   ├── Auth/            (NUEVO) LoginController, SessionController, MeController
│   ├── Admin/           UnidadesController, RutasController, KeywordsController,
│   │                    TabuladorAdminController, AuditController,
│   │                    UsuariosController (NUEVO), ExclusionesController (NUEVO),
│   │                    LiquidacionesController
│   ├── UploadController, CalculateController, CatalogController, TabuladorController
│   └── BaseController
├── Libraries/           ← lógica de negocio pura (núcleo a blindar con tests)
│   ├── BoletaProcessor.php      agrupa CSV, clasifica piernas, detecta cruces
│   ├── PayrollCalculator.php    total = base + diésel a favor + cruces + bonos
│   ├── PacificoDetector.php, RouteResolver.php, CsvParser.php
│   └── Pricing/ (NUEVO sugerido)  ExclusionResolver, CruceDeduplicator, DieselPerTrip
├── Models/              TabuladorModel, RutaModel, UnidadModel, PacificoKeywordModel,
│                        LiquidacionModel, AuditLogModel,
│                        UserModel, RoleModel, PermissionModel (NUEVOS),
│                        BoletaModel, ViajeModel, ExclusionModel (NUEVOS)
├── Filters/             AuthFilter, RoleFilter / PermissionFilter (NUEVOS), CORS
├── Database/
│   ├── Migrations/      aditivas y reversibles (ver doc 07)
│   └── Seeds/           Roles/Permisos, Admin inicial, catálogos
└── Config/              Routes, Filters, Cors, Database
```

### Principios de capa

- **Controllers delgados:** validan entrada, delegan a Libraries/Models, formatean respuesta. Sin lógica de pago.
- **Libraries puras:** la matemática de nómina no toca HTTP ni (idealmente) BD; recibe datos y devuelve datos → **100% testeable**.
- **Models por entidad:** un Model por tabla, con `allowedFields`, validación y soft-deletes donde aplique.
- **Backend = fuente única de verdad** del total. El frontend **no recalcula**; solo muestra.

---

## 3. API REST — convenciones

Siguiendo `Conocimiento/Desarrollo/APIs y Protocolos/`:

- **Versionado:** prefijo `/api/v1/` para nuevas rutas (las actuales `/api/*` se mantienen y se migran con compatibilidad).
- **Métodos/estados:** `GET` (200), `POST` (201), `PUT/PATCH` (200), `DELETE` (204); errores 4xx/5xx con cuerpo estándar.
- **Errores estándar** (formato consistente, estilo RFC 7807):
  ```json
  { "type": "validation_error", "title": "Datos inválidos",
    "status": 422, "detail": "El campo diesel_por_viaje debe ser numérico",
    "errors": { "diesel_por_viaje": ["numérico requerido"] } }
  ```
- **Autenticación:** header `Authorization: Bearer <token>` (ver RFC-001).
- **CORS:** restringido al origen del frontend (ya existe `Config/Cors.php`).
- **Paginación:** para listados grandes (auditoría, liquidaciones) cursor o page/per_page consistente.

### Mapa de endpoints (objetivo, resumen)

| Recurso | Endpoints | Rol mínimo |
|---|---|---|
| Auth | `POST /api/v1/auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | público / autenticado |
| Carga y cálculo | `POST /api/v1/upload` (solo Admin), `POST /api/v1/calculate` | Admin (upload) · Admin/Supervisor (calculate) |
| Liquidaciones | `GET/POST /api/v1/liquidaciones`, `POST /liquidaciones/{id}/aprobar|rechazar|cerrar` | Admin / Supervisor · **Operador: solo sus propios viajes (lectura)** |
| Catálogos (lectura) | `GET /api/v1/catalogs/*`, `GET /tabulador` | Admin / Supervisor / Auditor |
| Admin catálogos | `… /api/v1/admin/{tabulador,rutas,keywords,unidades,exclusiones}` (CRUD) | Admin |
| Admin usuarios/roles | `… /api/v1/admin/usuarios`, `/admin/roles` | Admin |
| Auditoría | `GET /api/v1/admin/audit-logs` | Auditor / Admin |

---

## 4. Frontend (React 19) — organización objetivo

Se conserva el estilo y los componentes actuales; se añade routing por rol y estado de sesión.

```
frontend/src/
├── api.js                  cliente HTTP (interceptor de token, manejo de 401)
├── auth/                   (NUEVO) AuthContext, useAuth, ProtectedRoute, RoleGate
├── components/             BoletaCard, TripList, TripCard, DashboardKPIs,
│                           SummaryBar, FileUpload, Sidebar, AdminSection, ...
│                           (se EXTIENDEN, no se reescriben)
├── features/ (sugerido)    liquidaciones/, catalogos/, usuarios/, auditoria/
├── design/ (NUEVO)         tokens.css / theme — extraídos del estilo actual
├── utils/                  exportExcel.js, ...
└── constants.js
```

- **Fuente de verdad del total:** se elimina el recálculo local en `BoletaCard.jsx`; el componente muestra `Total_Pay` del backend.
- **Control de acceso en UI:** `RoleGate` oculta acciones no permitidas; rutas protegidas redirigen a login. La UI es defensa en profundidad — **la autorización real vive en el backend**.
- **Estado:** Context para sesión/usuario; estado local/`useState`/`useReducer` por feature (sin sobre-ingeniería de store global).

---

## 5. Seguridad (transversal)

- Contraseñas con hashing fuerte (`password_hash` / Argon2id).
- Tokens con expiración corta + refresh; logout invalida refresh.
- Autorización **server-side** en cada endpoint vía Filters.
- Auditoría de toda mutación de catálogo y liquidación (quién, qué, antes/después, IP).
- Validación de entrada en backend (CI4 Validation) además de la del frontend.
- Headers de seguridad, CORS restringido, secrets vía variables de entorno (no en repo).

---

## 6. Entornos

| Entorno | BD | Propósito |
|---|---|---|
| Local / dev | MySQL en Docker (`docker-compose`) con seeds | Desarrollo y tests |
| CI | MySQL efímero en el pipeline | PHPUnit + lint en cada PR |
| Producción | MySQL `nomina-sotelo.dataholics.com.mx` (credenciales en Fase 5) | Operación real |

La BD de prueba (Docker) replica el esquema productivo vía migraciones + seeds, de modo que **lo probado es lo que se despliega**.
