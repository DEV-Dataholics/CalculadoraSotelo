# Modelo de Datos — Esquema Mejorado (MySQL)

| Campo | Valor |
|---|---|
| Proyecto | PayrollTool · Fletes Sotelo |
| Documento | 03 — Modelo de Datos |
| Versión | 1.0 |
| Fecha | 2026-06-11 |
| Autor | David García |
| Motor | MySQL 8 · InnoDB · `utf8mb4_unicode_ci` |
| Depende de | ADR-001, ADR-007 · [03b_plan_migracion](03b_plan_migracion.md) |

> **Principio:** cambios **aditivos y reversibles**; no se elimina nada en uso hasta cerrar la fase de verificación (ver doc 07).

---

## 1. Estado actual (tablas existentes)

| Tabla | Rol | Observación |
|---|---|---|
| `tabulador_tarifas` | Tarifas de cruce, resolución en 4 niveles | Tiene `version`, `is_active`, `prioridad` |
| `rutas_distancias` | Distancias por ruta (`region` ENUM) | Unique (origen, destino, region) |
| `pacifico_keywords` | Keywords para detectar Pacífico | Catálogo administrable |
| `unidades_rendimiento` | Rendimiento por unidad (5 decimales) | Base de litros permitidos |
| `liquidaciones_temporales` | (DROP en migración 2026-05-06) | Reemplazada |
| `liquidaciones` (LiquidacionModel) | Guarda `datos_boleta_json`, `session_token`, `status`, `semana_nomina` | **Des-normalizada (JSON)** |
| `audit_logs` | action, entity, details, ip | **Sin `user_id`** |

**Carencias detectadas:** no hay usuarios/roles; la liquidación es un blob JSON; auditoría no liga al autor; no hay catálogo de exclusiones; el diésel por viaje no tiene columna.

---

## 2. Modelo objetivo — ERD

```
┌──────────┐      ┌────────────────┐      ┌──────────────┐
│  users   │─────<│  user_roles    │>─────│    roles     │
└────┬─────┘      └────────────────┘      └──────┬───────┘
     │                                            │
     │            ┌────────────────────┐   ┌──────┴──────────┐
     │            │ refresh_tokens     │   │ role_permissions│
     │            └────────────────────┘   └──────┬──────────┘
     │                                            │
     │                                     ┌───────┴──────┐
     │                                     │ permissions  │
     │                                     └──────────────┘
     │
     │ (created_by / approved_by)
     ▼
┌─────────────────┐      ┌───────────┐      ┌────────────┐
│  liquidaciones  │─────<│  boletas  │─────<│   viajes   │
│  (cabecera)     │      │ (operador)│      │  (filas)   │
└─────────────────┘      └───────────┘      └─────┬──────┘
                                                   │ usa catálogos (lookup)
        ┌──────────────┬──────────────┬───────────┴───────┬─────────────────────┐
        ▼              ▼              ▼                    ▼                     ▼
 tabulador_tarifas  rutas_distancias  pacifico_keywords  unidades_rendimiento  exclusiones_pago_base

  audit_logs ──(user_id)──► users        catalog_versions ──► (versiona catálogos)
```

---

## 3. Tablas nuevas — definición

### 3.1 Identidad y acceso (Fase 1)

```sql
-- users
id BIGINT UNSIGNED PK AI
nombre        VARCHAR(120) NOT NULL
email         VARCHAR(150) NOT NULL UNIQUE
password_hash VARCHAR(255) NOT NULL
is_active     TINYINT(1) NOT NULL DEFAULT 1
last_login_at DATETIME NULL
unidad        VARCHAR(20) NULL          -- conductor: vincula al usuario con su unidad (rol Operador) para acotar "sus viajes"
operador_ref  VARCHAR(120) NULL         -- conductor: nombre/clave del operador en Genesis (alternativa/complemento a unidad)
created_at, updated_at, deleted_at (soft delete)
INDEX (unidad)

-- roles
id INT UNSIGNED PK AI
nombre      VARCHAR(50) NOT NULL UNIQUE      -- admin, operador (conductor), supervisor, auditor
descripcion VARCHAR(255) NULL

-- Nota de autorización por alcance:
--   El rol Operador (conductor) usa el permiso liquidacion.view.own y SOLO accede a los
--   viajes/boletas cuya unidad/operador coincide con users.unidad / users.operador_ref.
--   El filtrado se hace SIEMPRE server-side por la identidad del usuario autenticado.

-- permissions
id INT UNSIGNED PK AI
clave       VARCHAR(80) NOT NULL UNIQUE      -- liquidacion.approve, catalog.tabulador.manage, ...
descripcion VARCHAR(255) NULL

-- role_permissions  (PK compuesta)
role_id       INT UNSIGNED NOT NULL FK→roles(id) ON DELETE CASCADE
permission_id INT UNSIGNED NOT NULL FK→permissions(id) ON DELETE CASCADE
PRIMARY KEY (role_id, permission_id)

-- user_roles  (PK compuesta)
user_id BIGINT UNSIGNED NOT NULL FK→users(id) ON DELETE CASCADE
role_id INT UNSIGNED NOT NULL FK→roles(id) ON DELETE CASCADE
PRIMARY KEY (user_id, role_id)

-- refresh_tokens
id BIGINT UNSIGNED PK AI
user_id    BIGINT UNSIGNED NOT NULL FK→users(id) ON DELETE CASCADE
token_hash VARCHAR(255) NOT NULL
expires_at DATETIME NOT NULL
revoked_at DATETIME NULL
created_at DATETIME
INDEX (user_id), INDEX (expires_at)
```

### 3.2 Normalización de nómina (Fase 1–2)

```sql
-- liquidaciones (cabecera; evoluciona la tabla actual)
id BIGINT UNSIGNED PK AI
session_token  VARCHAR(64) NULL              -- compat con flujo actual
created_by     BIGINT UNSIGNED NULL FK→users(id)
approved_by    BIGINT UNSIGNED NULL FK→users(id)
estado         ENUM('BORRADOR','PENDIENTE','APROBADA','RECHAZADA','CERRADA') NOT NULL DEFAULT 'BORRADOR'
start_date     DATE NULL                     -- rango (ADR-008)
end_date       DATE NULL
semana_nomina  INT NULL                      -- informativo (legacy)
datos_boleta_json LONGTEXT NULL              -- snapshot/auditoría durante transición
total_general  DECIMAL(12,2) NULL
created_at, updated_at, deleted_at
INDEX (estado), INDEX (start_date, end_date), INDEX (created_by)

-- boletas (una por operador/unidad dentro de la liquidación)
id BIGINT UNSIGNED PK AI
liquidacion_id BIGINT UNSIGNED NOT NULL FK→liquidaciones(id) ON DELETE CASCADE
unidad         VARCHAR(20) NULL              -- D-002: filtrar por unidad, no por nombre
operador       VARCHAR(120) NULL
is_pacifico    TINYINT(1) NOT NULL DEFAULT 0
base_pay       DECIMAL(12,2) NOT NULL DEFAULT 0
diesel_a_favor DECIMAL(12,2) NOT NULL DEFAULT 0   -- Ajuste 1
pago_cruce     DECIMAL(12,2) NOT NULL DEFAULT 0   -- Ajuste 2 (dedupe)
bonos          DECIMAL(12,2) NOT NULL DEFAULT 0
total_pay      DECIMAL(12,2) NOT NULL DEFAULT 0   -- fuente única (ADR-003)
created_at, updated_at
INDEX (liquidacion_id), INDEX (unidad)

-- viajes (filas del CSV agrupadas)
id BIGINT UNSIGNED PK AI
boleta_id      BIGINT UNSIGNED NOT NULL FK→boletas(id) ON DELETE CASCADE
origen         VARCHAR(120) NULL
destino        VARCHAR(120) NULL
coordenada     VARCHAR(40)  NULL            -- D-004 (validación de formato)
tipo           VARCHAR(20)  NULL
cruce          VARCHAR(100) NULL
kms            DECIMAL(8,1) NOT NULL DEFAULT 0     -- tabulados (D-005), no odómetro
pago_por_km    DECIMAL(12,2) NOT NULL DEFAULT 0
diesel_precio_viaje DECIMAL(8,2) NULL       -- Ajuste 4: diésel por viaje (ex campo "Peso")
diesel_a_favor DECIMAL(12,2) NULL           -- Ajuste 1
litros_a_pago  DECIMAL(10,5) NULL           -- 5 decimales (R-010)
recarga        DECIMAL(10,2) NULL
es_cruce       TINYINT(1) NOT NULL DEFAULT 0
excluido_base  TINYINT(1) NOT NULL DEFAULT 0      -- Ajuste 3
fecha_viaje    DATE NULL                    -- ADR-008 (filtro por rango)
created_at, updated_at
INDEX (boleta_id), INDEX (fecha_viaje), INDEX (tipo), INDEX (es_cruce)
```

### 3.3 Catálogo de exclusiones (Fase 2 — ADR-006)

```sql
-- exclusiones_pago_base
id INT UNSIGNED PK AI
tipo_match  ENUM('COORDENADA','ORIGEN','DESTINO','RUTA') NOT NULL
valor       VARCHAR(120) NOT NULL          -- "TRI", "GT", "ZARAGOZA DTR", "FLETES SOTELO"
descripcion VARCHAR(255) NULL
is_active   TINYINT(1) NOT NULL DEFAULT 1
created_at, updated_at
UNIQUE (tipo_match, valor)
INDEX (is_active)
```

### 3.4 Versionado de catálogos (opcional, Fase 2/3)

```sql
-- catalog_versions  (metadatos de versión para auditoría de catálogos)
id INT UNSIGNED PK AI
catalogo    VARCHAR(50) NOT NULL          -- 'tabulador', 'rutas', ...
version     INT UNSIGNED NOT NULL
activa      TINYINT(1) NOT NULL DEFAULT 0
created_by  BIGINT UNSIGNED NULL FK→users(id)
nota        VARCHAR(255) NULL
created_at
UNIQUE (catalogo, version)
```

---

## 4. Cambios a tablas existentes (aditivos)

| Tabla | Cambio | Motivo |
|---|---|---|
| `audit_logs` | + `user_id BIGINT UNSIGNED NULL FK→users(id)`, + `before_json LONGTEXT NULL`, + `after_json LONGTEXT NULL` | Ligar acción al autor y registrar antes/después |
| `liquidaciones` | + `estado`, `created_by`, `approved_by`, `start_date`, `end_date`, `total_general` | Flujo de aprobación y rango de fechas |
| `tabulador_tarifas` | (sin cambio de esquema) revisar nivel 3 para que no aplique a locales (Ajuste 2) | Corrección lógica, no estructural |

> Las columnas nuevas se agregan **NULL** o con `DEFAULT` para no romper inserts existentes. La eliminación de `datos_boleta_json` (si se decide) ocurre en una migración posterior, tras verificar la normalización.

---

## 5. Integridad y rendimiento

- **InnoDB + FKs** en todas las relaciones nuevas (ON DELETE CASCADE donde el hijo no tiene sentido sin el padre).
- **Índices** en columnas de filtrado y join (`estado`, `fecha_viaje`, `unidad`, `tipo`, `es_cruce`, FKs).
- **Decimales con precisión adecuada:** dinero `DECIMAL(12,2)`; litros/rendimiento `DECIMAL(10,5)` (R-010 exige 5 decimales).
- **`utf8mb4`** para nombres/rutas con acentos.
- **Soft deletes** en `users` y `liquidaciones` (no borrar histórico de nómina).

---

## 6. Seeds iniciales

| Seed | Contenido |
|---|---|
| `RolesPermisosSeeder` (NUEVO) | 4 roles + catálogo de permisos + matriz Rol×Permiso del RFC-001 |
| `AdminUserSeeder` (NUEVO) | Usuario Admin inicial (password vía env, forzar cambio) |
| `ExclusionesSeeder` (NUEVO) | Exclusiones confirmadas (Tri, GT, Zaragoza DTR, Fletes Sotelo) — **pendiente lista final, doc 05** |
| `TabuladorSeeder`, `RutasSeeder`, `UnidadesSeeder`, `PacificoKeywordsSeeder` | Existentes — se conservan |
