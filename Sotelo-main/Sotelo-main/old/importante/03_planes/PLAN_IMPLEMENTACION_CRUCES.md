# Plan de Implementación: Lógica de Cruces y Tabulador de Tarifas

**Fecha:** Abril 2026  
**Proyecto:** Fletes Sotelo — MVP Nómina y Liquidación  
**Objetivo:** Implementar una capa centralizada de tarifas en backend para que cada movimiento reciba pago automático según tipo, cruce y ruta, con carga de tabulador versionada y trazable, y visualización clara en frontend.

---

## Fase 1 — Descubrimiento Técnico y Contratos de Datos

### 1.1 Revisión del sistema actual
- Auditar entradas y salidas de `api/calculate.php` (endpoint principal de cálculo).
- Auditar flujo de carga de archivos en `api/upload.php`.
- Revisar cómo se muestran los viajes en `TripCard.jsx`, `TripList.jsx` y `FileUpload.jsx`.

### 1.2 Definir esquema canónico del tabulador
Campos requeridos para cada registro de tarifa:

| Campo            | Tipo     | Descripción                                              |
|------------------|----------|----------------------------------------------------------|
| coordenada       | string   | Folio de viaje (ej. 2904627-23)                          |
| origen           | string   | Punto de inicio del movimiento                           |
| destino          | string   | Punto de entrega o descarga                              |
| tipo             | string   | Código de clasificación (S-TER-02, TRI-02, LOC-01, etc.)|
| cruce            | string   | Puente internacional utilizado o vacío si es local       |
| pago             | decimal  | Monto de la tarifa en pesos                              |
| vigencia_inicio  | date     | Fecha desde la que aplica la tarifa                      |
| vigencia_fin     | date     | Fecha hasta la que aplica la tarifa                      |
| activo           | boolean  | Si la tarifa está vigente                                |
| prioridad        | integer  | Para resolver colisiones entre tarifas                   |
| notas            | string   | Observaciones opcionales                                 |
| created_at       | datetime | Fecha de creación del registro                           |
| updated_at       | datetime | Última modificación                                      |

### 1.3 Reglas de normalización
- Convertir origen y destino a mayúsculas, sin acentos, con trim de espacios.
- Definir tabla de equivalencias para nombres alternativos (ej. "GYSA JUAREZ" = "GYSA JRZ").
- Tipo y cruce se validan contra catálogo cerrado.

---

## Fase 2 — Motor de Tarifas en Backend

### 2.1 Crear módulo `api/tabulador.php`
Archivo nuevo que encapsula toda la lógica de tarifas:

- **`cargarTabulador($archivo)`** — Lee CSV/XLSX, valida columnas, normaliza datos y genera estructura indexada en memoria.
- **`getTarifa($origen, $destino, $tipo, $cruce)`** — Busca la tarifa aplicable y devuelve pago + metadatos.
- **`validarArchivo($archivo)`** — Verifica formato, columnas requeridas y tipos de dato antes de aceptar el tabulador.
- **`listarVersiones()`** — Devuelve historial de tabuladores cargados.
- **`activarVersion($versionId)`** — Marca una versión como activa de forma atómica.

### 2.2 Algoritmo de resolución de tarifa
Orden de búsqueda (de más específico a menos específico):

1. Coincidencia exacta: `tipo + cruce + origen + destino`
2. Coincidencia parcial: `tipo + cruce` (cualquier origen/destino)
3. Coincidencia local: `tipo` sin cruce (para movimientos LOC/MDC)
4. Sin coincidencia → devolver `pago: null`, `motivo: "SIN_TARIFA_APLICABLE"`

### 2.3 Reglas de negocio codificadas

| Tipo           | Cruce              | Pago     | Categoría                  |
|----------------|---------------------|----------|----------------------------|
| S-TER-02       | PUENTE ZARAGOZA     | $1,125   | Cruce internacional premium|
| TRI-02         | PUENTE ZARAGOZA     | $500     | Importación estándar       |
| TRE-02         | PUENTE ZARAGOZA     | $500     | Exportación estándar       |
| IMP-02         | PUENTE ZARAGOZA     | $500     | Importación estándar       |
| LOC-01         | (vacío)             | $125     | Local corta distancia      |
| LOC-02         | (vacío)             | $250     | Local media distancia      |
| MDC-01         | (vacío)             | $125/$250| Local según cliente/ruta   |
| PTT-00         | (vacío)             | $0       | Patio a patio / vacío      |

### 2.4 Integrar cálculo en endpoint principal
Modificar `api/calculate.php`:
- Reemplazar reglas dispersas por llamada a `getTarifa()`.
- La respuesta debe incluir: `pago_calculado`, `regla_aplicada`, `fuente_tarifa`, `motivo` (si no hay match).

### 2.5 Integrar carga y versionado
Modificar `api/upload.php`:
- Aceptar CSV/XLSX del tabulador como tipo de archivo adicional.
- Validar columnas requeridas antes de persistir.
- Generar versión con timestamp y usuario.
- Guardar archivo versionado en carpeta `tabuladores/`.
- Activar nueva versión de forma atómica (sin ventana de inconsistencia).

---

## Fase 3 — Endpoints de Soporte e Integración Frontend

### 3.1 Nuevos endpoints

| Método | Ruta                          | Descripción                                  |
|--------|-------------------------------|----------------------------------------------|
| GET    | `api/tabulador.php?action=consultar` | Consultar tarifa por parámetros        |
| GET    | `api/tabulador.php?action=versiones` | Listar versiones del tabulador         |
| POST   | `api/tabulador.php?action=activar`   | Activar una versión específica         |
| POST   | `api/tabulador.php?action=validar`   | Pre-validar archivo antes de publicar  |

### 3.2 Integración en `frontend/src/api.js`
Agregar métodos:
- `getTarifaPreview(params)` — Consultar tarifa por tipo/cruce/ruta.
- `uploadTabulador(file)` — Subir nuevo archivo de tarifas.
- `listTabuladores()` — Obtener versiones disponibles.
- `activateTabuladorVersion(versionId)` — Activar versión.

### 3.3 Visualización en componentes existentes
- **`TripCard.jsx`** — Mostrar `pago_calculado` y `regla_aplicada` por viaje. Indicador visual si no hay tarifa.
- **`TripList.jsx`** — Propagar campos de detalle de tarifa por fila.
- **`SummaryBar.jsx`** — Indicadores agregados: total cruces, total locales, total no remunerados, monto acumulado.

### 3.4 Nuevo componente: `TabuladorManager.jsx`
Pantalla de administración del tabulador:
- Subir archivo CSV/XLSX.
- Ver errores de validación antes de confirmar.
- Listar versiones con fecha, usuario y estado (activa/inactiva).
- Botón para activar una versión.
- Solo accesible para usuarios autorizados.

---

## Fase 4 — Auditoría, Pruebas y Rollout

### 4.1 Observabilidad y auditoría
Registrar en backend:
- Quién subió cada tabulador (usuario, fecha, IP).
- Versión activada y versión anterior.
- Conteo de filas válidas y rechazadas por carga.
- Cada consulta de tarifa que resulte en "SIN_TARIFA_APLICABLE".

### 4.2 Plan de pruebas

| # | Prueba                                    | Criterio de éxito                                      |
|---|-------------------------------------------|--------------------------------------------------------|
| 1 | Unit test: S-TER-02 con cruce             | Devuelve $1,125                                        |
| 2 | Unit test: TRI-02 / TRE-02 / IMP-02       | Devuelve $500                                          |
| 3 | Unit test: LOC-01 / LOC-02 / MDC-01       | Devuelve $125 o $250 según caso                        |
| 4 | Unit test: PTT-00                         | Devuelve $0                                            |
| 5 | Unit test: tipo desconocido               | Devuelve null + motivo "SIN_TARIFA_APLICABLE"          |
| 6 | Colisión de prioridad                     | Selecciona tarifa con mayor prioridad                  |
| 7 | Vigencia expirada                         | Ignora tarifa fuera de rango de fechas                 |
| 8 | Integración calculate.php                 | Respuesta incluye pago_calculado y regla_aplicada      |
| 9 | Carga de archivo válido                   | Versión creada y activada correctamente                |
| 10| Carga de archivo con columnas faltantes   | Rechazado con mensaje de error claro                   |
| 11| Regresión con datos reales                | Pagos calculados coinciden con tabulador maestro        |

### 4.3 Migración y rollout
1. Ejecutar piloto con una semana de datos históricos.
2. Comparar pagos esperados vs. pagos calculados por el sistema.
3. Ajustar equivalencias de origen/destino según discrepancias.
4. Activar en producción con monitoreo intensivo la primera semana.

---

## Archivos Involucrados

| Archivo                                        | Acción    | Descripción                                  |
|------------------------------------------------|-----------|----------------------------------------------|
| `api/calculate.php`                            | Modificar | Integrar motor de tarifas en cálculo         |
| `api/upload.php`                               | Modificar | Validación de tabulador y versionado         |
| `api/tabulador.php`                            | Crear     | Módulo central de tarifas                    |
| `frontend/src/api.js`                          | Modificar | Métodos para consulta/carga de tabulador     |
| `frontend/src/components/TripCard.jsx`         | Modificar | Mostrar pago calculado y regla aplicada      |
| `frontend/src/components/TripList.jsx`         | Modificar | Propagar campos de tarifa por fila           |
| `frontend/src/components/SummaryBar.jsx`       | Modificar | Totales por categoría de movimiento          |
| `frontend/src/components/FileUpload.jsx`       | Modificar | Enlace a gestor de tabulador                 |
| `frontend/src/components/TabuladorManager.jsx` | Crear     | Administración de versiones del tabulador    |
| `tabuladores/`                                 | Crear     | Carpeta para almacenar versiones de archivos |

---

## Decisiones de Diseño

- **Lógica solo en backend:** el cálculo de tarifas se ejecuta exclusivamente en PHP para evitar inconsistencias.
- **Frontend solo consulta y muestra:** nunca calcula tarifas por su cuenta.
- **Normalización obligatoria:** todos los campos de texto se normalizan al ingresar para reducir falsos negativos.
- **Versionado atómico:** al activar una versión, el cambio es instantáneo y no afecta cálculos en curso.

## Consideraciones Pendientes

1. **Política de no coincidencia:** ¿bloquear cierre de viaje o permitir guardarlo con estado "pendiente de tarifa"?
2. **Fuente única de verdad:** ¿archivo versionado en disco o migrar a tabla en base de datos?
3. **Ventana de activación:** ¿inmediata o programada para no afectar corte de nómina en curso?

## Alcance

- **Incluye:** cálculo automático de pago, carga administrable, versionado, auditoría y visualización.
- **Excluye (por ahora):** control de acceso avanzado por roles, aprobación multinivel y recálculo histórico masivo retroactivo.
