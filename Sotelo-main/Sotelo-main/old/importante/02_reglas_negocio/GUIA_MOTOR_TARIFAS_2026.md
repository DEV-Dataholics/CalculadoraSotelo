# Guía Técnica: Motor de Resolución de Tarifas (Fase Cruces)
**Fecha:** Abril 2026  
**Estado:** Implementación Completada (v1.0)  
**Ubicación:** `backend/app/Models/TabuladorModel.php` & `Libraries/PayrollCalculator.php`

---

## 1. Introducción
El sistema de nómina de Fletes Sotelo ahora integra un **Motor de Resolución de Tarifas Automatizado**. Este módulo reemplaza las reglas de pago fijas (legacy) por una consulta dinámica a una base de datos de tabuladores, permitiendo que cada viaje (o row de una boleta) determine su pago exacto basándose en el tipo de movimiento, el cruce fronterizo y la ruta (origen/destino).

---

## 2. Flujo Operativo

### Paso 1: Carga Masiva (Tabulador CSV)
En la sección **Admin > Tabulador**, existe ahora un panel de carga CSV.
1. El usuario sube un archivo `.csv` con las columnas: `tipo, cruce, origen, destino, pago_operador, prioridad`.
2. El sistema valida los datos y crea una **Nueva Versión** (ej. v2).
3. **Importante:** Las versiones nuevas se cargan como **INACTIVAS** por seguridad. El sistema seguirá usando la versión anterior hasta que el administrador decida el cambio.

### Paso 2: Gestión y Activación de Versiones
El administrador puede ver una lista de todas las versiones cargadas:
- Cada registro muestra cuántas tarifas contiene y si está activa.
- Al hacer clic en **"Activar"**, el sistema realiza un cambio atómico: desactiva todas las demás versiones y activa la seleccionada. A partir de ese segundo, todos los cálculos de nómina usarán las nuevas tarifas.

### Paso 3: Proceso de Cálculo (Motor de Resolución)
Cuando se carga un CSV Genesis en el módulo de Nómina, el backend ejecuta la siguiente lógica para cada "trayecto" (Row):

#### Jerarquía de Búsqueda (4 Niveles de Especificidad)
El motor busca la tarifa de la más específica a la más general para asegurar precisión:
1. **Nivel 1 (Exacto):** Coincidencia total de `Tipo + Cruce + Origen + Destino`.
2. **Nivel 2 (Ruta Genérica):** Coincidencia de `Tipo + Cruce` (sin importar origen/destino específico).
3. **Nivel 3 (Local/PTT):** Coincidencia de `Tipo` únicamente (para movimientos sin cruce como LOC, MDC o PTT).
4. **Nivel 4 (Fallback):** Si nada coincide, el sistema marca el viaje con la fuente `PAGO_BASE_LEGACY` y no aplica tarifa del tabulador.

### Paso 4: Visualización en la UI
Los resultados del motor se reflejan en dos lugares:
1. **TripCard (Detalle de Boleta):** Se añade una sección verde **"Tarifa Cruce"**. Muestra el monto obtenido del tabulador y qué regla se aplicó (ej. `TRI-02`). Si no hay match, indica el motivo.
2. **SummaryBar (Resumen Inferior):** Se añaden contadores automáticos que clasifican los movimientos en **Cruces, Locales y PTT**, además de un contador de cuántas boletas se pagaron vía Tabulador BD.

---

## 3. Componentes Técnicos Actualizados

### Backend (PHP/CodeIgniter)
- **`TabuladorModel.php`**: Contiene la inteligencia del motor (`getTarifa()`). Gestiona el orden por `prioridad` para resolver colisiones.
- **`TabuladorController.php`**: Maneja la lógica de parseo de CSV, validación de columnas y control de versiones.
- **`BoletaProcessor.php`**: Normaliza los datos de entrada y detecta si un movimiento es "Cruce" (asignando automáticamente el puente correspondiente, ej: *PUENTE ZARAGOZA*).
- **`PayrollCalculator.php`**: El orquestador que llama al tabulador y suma los montos finales en el campo `Pago_Cruce`.

### Frontend (React)
- **`AdminSection.jsx`**: Interfaz para subir CSV y activar versiones.
- **`TripCard.jsx` / `SummaryBar.jsx`**: Despliegue visual de los datos procesados.
- **`api.js`**: Nuevos endpoints para interactuar con el tabulador (`/api/tabulador/*`).

---

## 4. Marcadores Visuales Temporales (`NEW` Badges)

Para facilitar la auditoría de esta nueva fase, se han agregado badges amarillos `✦ NUEVO` en todas las secciones creadas.

**Cómo quitarlos:**
Si el cliente decide que ya no son necesarios, se desactivan desde un solo lugar:
Archivo: `frontend/src/constants.js`
```javascript
export const SHOW_NEW_BADGES = false; // ← Cambiar de true a false
```

---

## 5. Mantenimiento Futuro
Para actualizar las tarifas el próximo mes:
1. Prepare un CSV con las nuevas tarifas.
2. Súbalo en el panel Admin.
3. Verifique que el sistema reporte las "Filas OK".
4. Haga click en "Activar" en la nueva versión generada.
5. Los cálculos anteriores no se ven afectados (puedes volver a una versión anterior si detectas un error).

> [!TIP]
> Si el tabulador está vacío o no hay versión activa, el sistema es **"Backward Compatible"**, lo que significa que seguirá funcionando con las reglas de pago base tradicionales sin romperse.
