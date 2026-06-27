# Estado Actual de la App

## ¿Cómo funciona la aplicación?

La aplicación está diseñada para procesar archivos de nómina (principalmente exportados desde Genesis en formato CSV), calcular incentivos y pagos de viajes, y mostrar resúmenes y KPIs de manera visual e interactiva. El flujo general es el siguiente:

1. **Carga de archivo:**
  - El usuario sube un archivo de nómina usando el componente de carga (`FileUpload`).
  - El archivo se envía al backend (`api/upload.php`), donde se valida y procesa. Se agrupan los datos por conductor y boleta, calculando distancias, litros permitidos y otros datos relevantes.
  - El backend responde con una lista de "trips" (viajes/boletas) estructurados.

2. **Selección de periodo:**
  - El usuario selecciona la semana de nómina a analizar mediante el componente `PeriodSelector`.

3. **Visualización y edición:**
  - Se muestran KPIs y resúmenes globales (`DashboardKPIs`, `SummaryBar`).
  - El usuario puede filtrar por conductor y estado del viaje (requiere captura, pendiente, aprobado).
  - Cada viaje/boleta se muestra como una tarjeta (`BoletaCard` o `TripCard`), donde se pueden editar datos como litros recargados, bonos, etc.
  - Al editar, los cálculos de incentivos y pagos se actualizan en tiempo real en el frontend.

4. **Re-cálculo y actualización:**
  - Al modificar datos de un viaje, el frontend puede enviar los datos al backend (`api/calculate.php`) para recalcular los montos y actualizar el estado del viaje.

5. **Resumen y exportación:**
  - El usuario puede ver un resumen de todos los viajes de la semana y exportar los datos si es necesario.

### Lógica de negocio principal

- El backend implementa reglas específicas para el cálculo de incentivos, bonos y pagos, diferenciando entre rutas "Pacífico" y "Chihuahua".
- Se consideran distancias, litros permitidos, recargas, y diferentes tipos de bonos según el tipo de viaje y parámetros manuales.
- El frontend permite la edición interactiva de los datos y refleja los cambios de manera inmediata.

---

## 1. Estructura del Proyecto

- **Frontend:**
  - Ubicación: `frontend/`
  - Estructura basada en React + Vite + Tailwind CSS
  - Componentes principales en `src/components/`
  - Utilidades en `src/utils/`
  - Archivos de configuración: `vite.config.js`, `tailwind.config.js`, `eslint.config.js`, `postcss.config.js`

- **Backend/API:**
  - Ubicación: `api/`
  - Endpoints PHP: `calculate.php`, `upload.php`
  - Archivo de ruteo: `router.php`

- **Documentación y recursos:**
  - Documentos técnicos y de gestión en `importante/`
  - Mockups y archivos de datos de ejemplo en la raíz

## 2. Componentes Clave del Frontend

- `BoletaCard.jsx`: Muestra información de boletas
- `DashboardKPIs.jsx`: Indicadores clave de desempeño
- `FileUpload.jsx`: Subida de archivos
- `PeriodSelector.jsx`: Selección de periodos
- `SummaryBar.jsx`: Resumen de datos
- `TripCard.jsx` y `TripList.jsx`: Gestión de viajes

## 3. Endpoints y Backend

- `api/calculate.php`: Procesa cálculos relacionados con la nómina o datos cargados
- `api/upload.php`: Maneja la subida de archivos
- `router.php`: Posible ruteo de peticiones (requiere revisión para detalles de endpoints)

## 4. Dependencias Principales

- **Frontend:**
  - React
  - Vite
  - Tailwind CSS
  - PostCSS
  - ESLint

- **Backend:**
  - PHP (sin framework detectado)

## 5. Funcionalidades Implementadas

- Subida y procesamiento de archivos de nómina
- Visualización de KPIs y resúmenes
- Gestión y visualización de boletas y viajes
- Selección de periodos para consulta

## 6. Funcionalidades Pendientes / Observaciones

- Documentar endpoints y flujos completos del backend
- Mejorar validaciones y manejo de errores en frontend y backend
- Integrar autenticación/seguridad si es necesario
- Revisar y actualizar dependencias
- Completar documentación técnica y de usuario

---

_Última actualización: 12 de abril de 2026_
