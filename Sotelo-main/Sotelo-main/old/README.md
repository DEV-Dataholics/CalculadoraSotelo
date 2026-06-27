# Sotelo — Sistema de Cálculo de Fletes

Aplicación web para el cálculo y gestión de fletes de transporte. Integra un motor de cálculo con un panel de administración para mantener catálogos, tarifas y trazabilidad de operaciones.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | PHP — CodeIgniter 4 |
| Base de datos | MySQL / MariaDB |
| Frontend | React 19 + Vite 7 |
| Estilos | Tailwind CSS 4 |

---

## Estructura del proyecto

```
Sotelo/
├── backend/                  # API REST (CodeIgniter 4)
│   └── app/
│       ├── Controllers/
│       │   ├── Admin/        # Controladores del panel admin
│       │   ├── CalculateController.php
│       │   ├── CatalogController.php
│       │   ├── TabuladorController.php
│       │   └── UploadController.php
│       ├── Models/           # Modelos de base de datos
│       ├── Database/
│       │   └── Migrations/   # Esquema de tablas
│       └── Config/
│           └── Routes.php    # Definición de endpoints
├── frontend/                 # SPA en React
│   └── src/
│       ├── components/
│       │   ├── AdminSection.jsx   # Panel de administración completo
│       │   └── DashboardKPIs.jsx
│       ├── api.js            # Cliente HTTP
│       └── App.jsx
├── importante/               # Documentación del proyecto (ver importante/README.md)
├── agents/                   # Definición de agentes de desarrollo
└── router.php                # Router para servidor embebido de PHP (dev local)
```

---

## Panel de Administración

El panel se activa accediendo a la ruta `/admin`. Está compuesto por **5 secciones** organizadas en pestañas.

### 1. Unidades

Gestiona el rendimiento de combustible (km/L) de cada tractor de la flota.

- **Tabla:** `unidades_rendimiento`
- **Campos clave:** `tractor` (único), `yield_km_l`
- **Uso:** El motor de cálculo consulta este catálogo para estimar el gasto de combustible por ruta
- **Controlador:** `backend/app/Controllers/Admin/UnidadesController.php`
- **Endpoints:** `GET / POST / PUT / DELETE /api/admin/unidades`

### 2. Rutas

Catálogo de distancias entre pares origen-destino, segmentadas por región.

- **Tabla:** `rutas_distancias`
- **Campos clave:** `origen_normalizado`, `destino_normalizado`, `distancia_km`, `region`
- **Regiones disponibles:** `GENERAL`, `PACIFICO`, `CLIENTE`
- **Uso:** El motor de cálculo busca aquí la distancia de cada movimiento antes de aplicar tarifas
- **Controlador:** `backend/app/Controllers/Admin/RutasController.php`
- **Endpoints:** `GET / POST / PUT / DELETE /api/admin/rutas`

### 3. Keywords

Lista de palabras clave que identifican registros del sistema Pacifico.

- **Tabla:** `pacifico_keywords`
- **Campos clave:** `keyword` (único, mayúsculas)
- **Uso:** Cuando un campo de texto contiene alguna keyword, el sistema aplica reglas de cálculo específicas para Pacifico
- **Controlador:** `backend/app/Controllers/Admin/KeywordsController.php`
- **Endpoints:** `GET / POST / PUT / DELETE /api/admin/keywords`

### 4. Tabulador

Sistema de tarifas para el cálculo del pago al operador, con soporte de múltiples versiones.

- **Tabla:** `tabulador_tarifas`
- **Campos clave:** `tipo`, `cruce`, `origen`, `destino`, `pago_operador`, `version`, `prioridad`
- **Controlador:** `backend/app/Controllers/Admin/TabuladorAdminController.php`
- **Modelo:** `backend/app/Models/TabuladorModel.php`

#### Algoritmo de resolución de tarifas (4 niveles)

El sistema busca la tarifa aplicable del nivel más específico al más general:

```
1. tipo + cruce + origen + destino  →  coincidencia exacta
2. tipo + cruce
3. solo tipo
4. fallback (null)
```

#### Gestión de versiones

- Pueden coexistir múltiples versiones del tabulador en la base de datos
- Solo una versión está **activa** en cada momento
- Flujo recomendado para actualizar tarifas:
  1. Descargar la plantilla CSV desde el panel
  2. Completar con las nuevas tarifas
  3. Subir el CSV → se crea una nueva versión sin afectar la activa
  4. Revisar la vista previa de datos en el modal
  5. Activar la nueva versión cuando todo esté correcto

**Endpoints de versiones:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/tabulador/versiones` | Lista todas las versiones |
| `POST` | `/api/tabulador/upload` | Importa CSV (crea nueva versión) |
| `POST` | `/api/tabulador/activar` | Activa una versión |
| `POST` | `/api/tabulador/desactivar` | Desactiva una versión |
| `DELETE` | `/api/tabulador/version/{id}` | Elimina una versión completa |

### 5. Audit

Registro de actividad de solo lectura. Muestra todas las operaciones realizadas en el panel.

- **Tabla:** `audit_logs`
- **Campos:** `action`, `entity_type`, `entity_id`, `details` (JSON), `ip_address`, `created_at`
- **Filtros disponibles:** por tipo de acción y por entidad
- **Controlador:** `backend/app/Controllers/Admin/AuditController.php`
- **Endpoint:** `GET /api/admin/audit-logs`

---

## Componentes UI reutilizables

Todos definidos en `frontend/src/components/AdminSection.jsx` (971 líneas):

| Componente | Descripción |
|-----------|-------------|
| `AdminTable` | Tabla con búsqueda en tiempo real, ordenamiento por columna y paginación (20 filas/página) |
| `AdminFormModal` | Modal único para crear y editar — adapta sus campos según la entidad activa |
| `AdminHero` | Barra de estadísticas: total de registros, activos, inactivos y versión activa del tabulador |

---

## Endpoints de la API

### Módulo operativo

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/upload` | Carga de archivo para cálculo |
| `POST` | `/api/calculate` | Ejecuta el cálculo de flete |
| `GET` | `/api/catalogs/rendimientos` | Catálogo de rendimientos |
| `GET` | `/api/catalogs/rutas` | Catálogo de rutas |
| `GET` | `/api/catalogs/keywords` | Catálogo de keywords |
| `GET` | `/api/tabulador` | Consulta tarifa aplicable |

### Panel de administración

| Método | Ruta | Descripción |
|--------|------|-------------|
| `*` | `/api/admin/unidades` | CRUD de unidades |
| `*` | `/api/admin/rutas` | CRUD de rutas |
| `*` | `/api/admin/keywords` | CRUD de keywords |
| `*` | `/api/admin/tabulador` | CRUD de tarifas |
| `GET` | `/api/admin/audit-logs` | Consulta de logs |

---

## Base de datos — tablas principales

| Tabla | Propósito |
|-------|-----------|
| `unidades_rendimiento` | Rendimiento km/L por tractor |
| `rutas_distancias` | Distancias origen-destino por región |
| `pacifico_keywords` | Palabras clave del sistema Pacifico |
| `tabulador_tarifas` | Tarifas por tipo de movimiento con versionado |
| `audit_logs` | Log inmutable de operaciones |

Las migraciones están en `backend/app/Database/Migrations/`.

---

## Notas de seguridad

El panel de administración actualmente **no cuenta con autenticación**. Las rutas `/api/admin/*` están expuestas sin validación de credenciales ni roles. Se recomienda implementar:

- Middleware de autenticación (JWT o sesión) en CodeIgniter
- Control de acceso basado en roles (RBAC)
- Validación de CORS para peticiones de administración
