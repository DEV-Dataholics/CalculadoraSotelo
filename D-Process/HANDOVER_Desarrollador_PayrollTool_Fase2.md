# HANDOVER TECNICO — PayrollTool Fase 2
## Proyecto: Nomina Foranea Fletes Sotelo

**Empresa:** Dataholics  
**Cliente:** Fletes Sotelo  
**Contacto tecnico:** Luis Carlos Morales Lopez (CTO) — luis@dataholics.com.mx  
**Fecha de entrega de este documento:** 15/03/2026  
**Estado del proyecto al momento de entrega:** MVP Fase 1 funcional y desplegado en hosting. Fase 2 pendiente de implementacion.

---

## 1. Que es este proyecto

PayrollTool es una herramienta web interna para calcular la nomina de operadores de fletes de camion de carga de la empresa Fletes Sotelo.

Los operadores realizan viajes (Chihuahua local y Pacifico foraneo). Al terminar la semana, el administrativo exporta un CSV del sistema Genesis y lo sube a esta herramienta. El sistema calcula automaticamente:

- Pago base por viaje (cargado o vacio)
- Kilometros por ruta
- Litros de diesel permitidos por unidad
- Incentivo de diesel: si el operador gasto menos de lo permitido, gana la diferencia en efectivo

La herramienta reemplaza hojas de Excel manuales con errores frecuentes.

---

## 2. Estado actual del sistema (lo que ya existe y funciona)

### Desplegado en produccion
- URL: `nomina-sotelo.dataholics.com.mx`
- Hosting: Site5 / cPanel compartido (PHP + Apache)

### Lo que ya funciona hoy
1. Carga de CSV exportado de Genesis
2. Deteccion automatica del tipo de operacion (Chihuahua vs Pacifico)
3. Agrupacion de movimientos en viajes por conductor
4. Calculo de pago base por tramo (cargado: $110/tramo, vacio: $55/tramo)
5. Calculo de kilómetros por tabla de rutas (nombres reales de clientes/plantas)
6. Calculo de litros permitidos por rendimiento oficial de unidad (5 decimales)
7. Calculo de incentivo diesel con referencia automatica
8. Inputs manuales por viaje: litros recargados reales
9. Viajes Pacifico: inputs manuales de bonos y estancias
10. Filtro por semana de nomina y por estado (PENDING / NEEDS_INPUT / APPROVED)
11. Dashboard de KPIs y barra de resumen

### Archivos de produccion en el servidor
```
docroot/
├── index.html              ← React SPA compilado
├── vite.svg
├── assets/
│   ├── index-DSJEswAm.js   ← Bundle JS (React + logica)
│   └── index-Ck7nU3Cp.css
├── .htaccess               ← SPA routing + rutas API PHP
└── api/
    ├── upload.php          ← Procesa CSV Genesis, retorna JSON de viajes
    └── calculate.php       ← Recalcula nomina con inputs manuales
```

---

## 3. Estructura del repositorio local

Ruta base: `proyectos/Calculadoras Sotelo/PayrollTool/`

```
PayrollTool/
├── frontend/               ← Codigo fuente React + Vite
│   ├── src/
│   │   ├── App.jsx         ← Componente raiz, manejo de estado global
│   │   ├── api.js          ← URL base del API (localhost vs produccion)
│   │   └── components/
│   │       ├── FileUpload.jsx
│   │       ├── TripList.jsx
│   │       ├── TripCard.jsx        ← Card por viaje con inputs manuales
│   │       ├── SummaryBar.jsx
│   │       ├── PeriodSelector.jsx
│   │       └── DashboardKPIs.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                ← Codigo Python (Fase 1, ahora reemplazado por PHP)
│   ├── main.py             ← FastAPI (ya no se usa en produccion)
│   ├── requirements.txt
│   └── logic/
│       └── payroll.py      ← Logica de nomina original en Python
│           ← REFERENCIA para portar reglas nuevas a PHP
│
├── HOSTING_DEPLOY_READY/   ← Paquete listo para subir al servidor
│   └── public/
│       ├── index.html
│       ├── assets/
│       ├── .htaccess
│       └── api/
│           ├── upload.php      ← Backend PHP actual
│           └── calculate.php   ← Backend PHP actual
│
└── D-Process/              ← Documentacion del proyecto
    ├── SOW_PayrollTool_Fase2_Nuevas_Reglas.md
    ├── Guideline_Desarrollo_MVP_PayrollTool_Fase2.md
    └── HANDOVER_Desarrollador_PayrollTool_Fase2.md  ← este archivo
```

---

## 4. Stack tecnico

| Capa | Tecnologia | Notas |
|---|---|---|
| Frontend | React 19 + Vite 7 + Tailwind CSS 4 | Bundle estatico |
| Backend | PHP 8.x puro (sin frameworks) | `api/upload.php` y `api/calculate.php` |
| Hosting | Site5 / cPanel compartido | Sin Python App, sin Node.js server |
| Datos entrada | CSV exportado de Genesis | Solo CSV en esta version |
| Persistencia | Ninguna | Stateless por request |

### Como corre en local (desarrollo)

**Backend Python (referencia, para pruebas de logica):**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ para produccion
```

> El frontend detecta automaticamente si esta en `localhost` y apunta a `http://localhost:8000`.
> En produccion apunta a rutas relativas `/api/upload` y `/api/calculate`.
> Esto esta configurado en `frontend/src/api.js`.

---

## 5. Como funciona el API PHP

### POST `/api/upload`
- Recibe: archivo CSV (`multipart/form-data`, campo `file`)
- Parsea el CSV de Genesis, agrupa por conductor, clasifica viajes, calcula base y diesel
- Devuelve: `{ "trips": [ {...}, {...} ] }`

### POST `/api/calculate`
- Recibe: `{ "trips": [ {...} ] }` (JSON body)
- Recalcula incentivo diesel y totales con los inputs manuales del operador
- Devuelve: `{ "trips": [ {...} ] }` con campos `Diesel_Savings`, `Incentive_Pay`, `Total_Pay`

### Estructura de un objeto Trip (JSON)
```json
{
  "id": "NOMBRE CONDUCTOR_0_1234567890",
  "Trip_ID": "Trip_1",
  "Driver": "JUAN PEREZ",
  "Unit": "F-021",
  "Start_Date": "2025-10-13 08:00",
  "End_Date": "2025-10-14 17:30",
  "Route": "FLETES SOTELO->GYSA OBREGON PDC ($110.00) | ...",
  "Total_Kms_Raw": 1021.0,
  "Total_Kms_Paid": 1021.0,
  "Allowed_Liters": 416.67,
  "Yield_Used": 2.45098,
  "Base_Pay": 330.0,
  "Diesel_Rate": 14.85,
  "Manual_Refuel_Liters": 0.0,
  "Payroll_Week": 42,
  "Status": "PENDING",
  "Is_Pacifico": false,
  "Manual_Pac_Loaded": false,
  "Manual_Pac_Bono_Sierra": false,
  "Manual_Pac_Bono_Doble": false,
  "Manual_Pac_Estancia_Obregon": 0,
  "Manual_Pac_Estancia_Mochis": 0,
  "Legs": [
    { "Origin": "FLETES SOTELO", "Destination": "GYSA OBREGON PDC", "Type": "FOR-02", "Status": "FACTURADO", "Kms": 1021.0, "Is_Loaded": true }
  ]
}
```

---

## 6. Logica de negocio clave (ya implementada en PHP)

### Deteccion de ruta Pacifico
Si cualquier `Origen` o `Destino` contiene palabras clave como `OBREGON`, `MOCHIS`, `GUAMUCHIL`, `GYSA`, etc., el conductor se clasifica como Foraneo Pacifico y se aplica calculo diferente.

### Agrupacion de viajes (`bundle_movements`)
Los movimientos del CSV se agrupan en "viajes" por conductor. Cada vez que el destino es un hub de retorno (JUAREZ, JRZ, BASE SOTELO, EL PASO, PRECOS) se cierra el viaje.

### Calculo de kilometros
Prioridad:
1. Tabla de rutas con nombre real de cliente/planta (`$ROUTE_DISTANCES_CLIENTS`)
2. Tabla de ciudades normalizadas (`$ROUTE_DISTANCES`)
3. Tabla Pacifico (`$ROUTE_DISTANCES_PACIFICO`)
4. Fallback: kilometros del CSV de Genesis

### Deduccion ELP (ya implementada)
Rutas que pasan por Rio Bravo, El Paso o Zaragoza tienen una deduccion de 40 km de la frontera para evitar doble pago del tramo internacional.

### Precio diesel de referencia
- Foraneo Chihuahua: $14.85 MXN/litro
- Pacifico: $16.00 MXN/litro (default)

### Formula de incentivo
```
Incentivo = (Litros_Permitidos - Litros_Reales_Recargados) × Precio_Litro
```

---

## 7. Lo que falta implementar en Fase 2

Ver SOW completo en: `D-Process/SOW_PayrollTool_Fase2_Nuevas_Reglas.md`

Resumen de pendientes priorizados:

### Alta prioridad
| # | Tarea | Archivo a modificar |
|---|---|---|
| 1 | **Diesel semi-automatico**: el incentivo NO debe calcularse al subir el CSV, solo cuando el operador captura litros reales | `upload.php` — status inicial `NEEDS_INPUT` para campo diesel; `calculate.php`, `TripCard.jsx` |
| 2 | **Campo de precio real**: el operador debe poder ingresar el precio real del ticket (no usar siempre el precio de referencia) | `TripCard.jsx`, `calculate.php` |
| 3 | **Separacion de precio por tipo**: Local/Cruce = $14.50 / Foraneo Chihuahua = $14.85, con fallback visible cuando no hay precio manual | `upload.php` (asignar `Diesel_Rate` correcto por tipo), `TripCard.jsx` |

### Media prioridad
| # | Tarea | Archivo a modificar |
|---|---|---|
| 4 | **Bono Quimico**: $250 MXN por viaje, activacion manual (toggle) mientras se precisa la regla exacta | `calculate.php`, `TripCard.jsx` |
| 5 | **Deduccion de Cruce — 6 escenarios**: extender la logica ELP actual para cubrir todos los casos operativos documentados | `upload.php` → funcion `get_route_kms` y ajuste de `kms_adj` |

### Catalogos (baja riesgo, alta precision)
| # | Tarea | Archivo a modificar |
|---|---|---|
| 6 | Actualizar tabla de rendimientos `$UNIT_YIELDS` con version oficial | `upload.php` |
| 7 | Ampliar `$ROUTE_DISTANCES_CLIENTS` con rutas faltantes | `upload.php` |
| 8 | Actualizar clasificacion de movimientos Genesis (tipos `MDC`, `PTT`, etc.) | `upload.php` → funcion `calculate_chihuahua_payroll` |

---

## 8. Columnas del CSV de Genesis

El sistema espera estas columnas (los nombres deben coincidir exactamente):

| Columna | Descripcion |
|---|---|
| `Conductor` | Nombre del operador (clave de agrupacion) |
| `Tractor` | Unidad (ej. `F-021`) — determina rendimiento |
| `Arranque` | Fecha/hora de salida |
| `Arribo destino` | Fecha/hora de llegada |
| `Origen` | Nombre del cliente/planta de origen |
| `Destino` | Nombre del cliente/planta de destino |
| `Kms` | Kilometros segun Genesis (fallback si no esta en tabla) |
| `Estatus flete` | `FACTURADO` = viaje cargado |
| `Tipo` | Codigo de movimiento (ej. `FOR-02`, `PTT-00`) |
| `Comentarios` | Texto libre (se detecta `VACIO`, `VASIO`) |

---

## 9. Criterios de aceptacion para liberar Fase 2

1. El CSV sube y los viajes aparecen sin incentivo calculado (status `NEEDS_INPUT` en campo diesel).
2. El operador ingresa litros reales y precio real → el incentivo se calcula correctamente.
3. Si no hay precio manual, el sistema usa el precio de referencia por zona y lo indica visualmente.
4. Bono Quimico se suma correctamente al total cuando esta activo.
5. La deduccion de cruce funciona en los 6 escenarios.
6. Resultados coinciden con casos historicos de control provistos por Fletes Sotelo.

---

## 10. Como hacer deploy

1. Editar los archivos PHP en `HOSTING_DEPLOY_READY/public/api/`
2. Si hay cambios en el frontend: `cd frontend && npm run build`, luego copiar `frontend/dist/*` a `HOSTING_DEPLOY_READY/public/`
3. Subir la carpeta `public/` al docroot de `nomina-sotelo.dataholics.com.mx` via FTP o cPanel File Manager

FTP disponible para subida a staging:
- Servidor: `ftp.dataholics.com.mx` puerto `21`
- Usuario: (solicitarlo a Luis Carlos)

---

## 11. Preguntas frecuentes anticipadas

**¿Por que PHP y no Python?**
El hosting es Site5 compartido con cPanel. No tiene soporte para Python Apps. PHP es el unico runtime disponible server-side. El backend fue portado completamente de FastAPI/Python a PHP puro sin perdida de logica.

**¿Hay base de datos?**
No. Todo es stateless. El CSV entra, se procesa en memoria, sale JSON. No hay sesiones ni persistencia entre requests. Si en el futuro se necesita guardar nominas, se requeriria MySQL (disponible en cPanel).

**¿El backend Python sigue funcionando?**
Solo en local para pruebas. En produccion el backend es 100% PHP. La logica es identica — `backend/logic/payroll.py` es la referencia para cualquier duda sobre como funciona el calculo.

**¿Hay tests automatizados?**
Hay scripts de prueba en la raiz de `PayrollTool/`: `test_csv_upload.py`, `test_e2e_api.py`, `test_week_logic.py`. Corren contra el backend Python local. Para Fase 2 se recomienda crear equivalentes en PHP o validar manualmente contra los casos de control.

---

## 12. Contacto y accesos

| Concepto | Detalle |
|---|---|
| CTO Dataholics | Luis Carlos Morales Lopez — luis@dataholics.com.mx |
| Acceso FTP | Solicitarlo al CTO antes de iniciar |
| Datos de prueba | `PayrollTool/demo_data.csv` |
| Dataset real de referencia | Solicitarlo al CTO (datos sensibles) |
| Repositorio | Solicitar acceso al CTO |
