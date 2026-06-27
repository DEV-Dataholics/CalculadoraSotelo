# REPORTE DE HALLAZGOS — REVISIÓN DE REGLAS DE PAGO
**Fecha de revisión:** 15 de marzo de 2026  
**Fuentes analizadas:**
- `Reportes/FORMA DE PAGO PARA LOS DIFERENTES TIPOS DE OPERADORES FLETES SOTELO (2).txt` ← Documento base existente
- `pacifico_rules.txt` ← Reglas existentes Foráneo Pacífico
- `Seguimiento/El proceso de foraneo chihuahua.md` ← NUEVO
- `Seguimiento/TRANSCRIPCION HERIBERTO (1).md` ← NUEVO
- `Seguimiento/Unidades rendimiento fCH - Hoja 1.csv` ← NUEVO
- `Seguimiento/rutas (1).xlsx - rutas.csv` ← NUEVO
- `Seguimiento/Movimientos octubre 2025.xlsx - Worksheet (2).csv` ← NUEVO

---

## SECCIÓN 1 — REGLAS QUE SE CONFIRMAN SIN CAMBIOS

Las siguientes reglas del documento base siguen vigentes y fueron confirmadas en los nuevos documentos:

| Concepto | Valor | Confirmado en |
|---|---|---|
| Mano de obra Foráneo ChihuahuaCargado | $110.00 | Transcripción Heriberto |
| Mano de obra Foráneo ChihuahuaVacío / PT | $55.00 | Transcripción Heriberto |
| Mano de obra Foráneo Pacífico Cargado | $0.30 por km | Transcripción Heriberto |
| Mano de obra Foráneo Pacífico Vacío / PT | $0.15 por km | Transcripción Heriberto |
| Bono Sierra (Pacífico) | $500.00 | Proceso foráneo Chihuahua.md |
| Estancia Obregón (Pacífico) | $600.00 (24 hrs detenido) | pacifico_rules.txt |
| Estancia Guamúchil / Los Mochis (Pacífico) | $300.00 c/6 hrs | pacifico_rules.txt |
| Bono Doble Operador Aptiv Guamúchil | $2,439.00 (24 hrs Guamúchil→Juárez) | pacifico_rules.txt |
| Bono Doble Operador Obregón | $1,726.00 (solo si cliente lo solicita) | pacifico_rules.txt |
| Estado de viaje válido para pago | Solo "Terminado" o "Completo" en Génesis | Proceso foráneo Chihuahua.md |
| Multiplicador costo indirecto administrativo | 63% sobre costo directo operativo | Transcripción Heriberto |

---

## SECCIÓN 2 — HALLAZGO #1: PRECIO DEL DIÉSEL — DIFERENCIA DETECTADA

> **⚠ DISCREPANCIA IMPORTANTE**

El documento base indica un precio de **$14.50 pesos/litro** para pago a operadores locales y de cruce.

Sin embargo, la carpeta Seguimiento confirma un precio de **$14.85 pesos/litro** específicamente para la zona Chihuahua (Foráneo Chihuahua).

**Cita textual del documento `El proceso de foraneo chihuahua.md`:**
> *"el ahorro sobrante se liquida a $14.85 pesos por litro (en la zona Chihuahua)"*

**Cita textual de la Transcripción Heriberto:**
> *"Chihuahua es a 1485 [sic]. Ese pago sí es fijo."*

### Conclusión:
Los dos precios conviven: **$14.50/litro para locales y cruce** y **$14.85/litro para foráneos Chihuahua**. El documento base no hace esta distinción y debe actualizarse para evitar errores de cálculo.

---

## SECCIÓN 3 — HALLAZGO #2: BONO QUÍMICO — REGLA NO DOCUMENTADA ANTERIORMENTE

> **🆕 REGLA NUEVA (no estaba en el documento base)**

Se identifica un **Bono Químico de $250.00 pesos** para operadores foráneos.

**Cita textual del documento `El proceso de foraneo chihuahua.md`:**
> *"Se aplican los bonos operativos (como el Bono Químico de $250.00 o el Bono Sierra de $500.00) si se cumplen las reglas."*

### Pendiente a clarificar:
- ¿Aplica solo a Foráneo Chihuahua o también a Pacífico?
- ¿Cuál es la condición exacta para activar el bono? (se menciona que debe "cumplir las reglas" pero no se detallan en los documentos revisados)

---

## SECCIÓN 4 — HALLAZGO #3: DEDUCCIÓN DE CRUCE — REGLA DE CÁLCULO NO DOCUMENTADA

> **🆕 REGLA NUEVA (no estaba explícita en el documento base)**

Existe una regla llamada **"Deducción de Cruce"** que aplica en la liquidación de Foráneo Chihuahua:  
Cuando un viaje incluye cruce fronterizo internacional (El Paso ↔ Juárez), los kilómetros del tramo fronterizo se restan del total nacional **para evitar que el operador cobre dos veces el mismo tramo**.

**Cita textual del documento `El proceso de foraneo chihuahua.md`:**
> *"se aplica el filtro de protección llamado 'Deducción de Cruce', donde se resta el kilometraje de los cruces internacionales del total nacional para garantizar que el operador no cobre dos veces el mismo tramo fronterizo."*

**Cita textual de la Transcripción:**
> *"yo el cruce se lo pago y luego le pago nacional, no más que para estadísticas ... el cruce se apaga por separado"*

### Implicación práctica:
En rutas como "El Paso → Chihuahua" (415 km), se restan los km de cruce (~40 km del puente) antes de calcular la mano de obra nacional. Los 6 casos posibles de combinación ruta-cruce son:
1. Juárez → Chihuahua
2. Chihuahua → Juárez
3. El Paso → Chihuahua (con cruce, se deduce km de El Paso)
4. El Paso → Chihuahua Fokker/Haer (plantas afueras, km adicionales)
5. El Paso → plantas afueras → Juárez
6. El inverso de las anteriores

---

## SECCIÓN 5 — HALLAZGO #4: TABLA COMPLETA DE RENDIMIENTOS POR UNIDAD

> **🆕 DATO NUEVO — Tabla formalizada**

El documento `Seguimiento/Unidades rendimiento fCH - Hoja 1.csv` proporciona la tabla oficial y completa de rendimientos mínimos por unidad para el cálculo de diesel. Esta tabla no existía de forma explícita en el documento base.

| Rendimiento | Unidades |
|---|---|
| **2.11267** | F-045, F-051, F-059, F-069, F-074, F-082, F-100 |
| **2.37341** | F-002 al F-019, F-050, F-060 al F-063, F-086 al F-092, F-097 al F-099, F-107, F-108, F-110 |
| **2.45098** | F-021 al F-031, F-033, F-040, F-042 |
| **2.60127** | F-034, F-035, F-036 |

> El rendimiento mínimo con **5 decimales** es obligatorio para que el sistema arroje exactamente los litros permitidos que definió la dirección.

---

## SECCIÓN 6 — HALLAZGO #5: TABLA DE RUTAS EXPANDIDA CON NOMBRES DE CLIENTES

> **🆕 DATO NUEVO — Rutas reales con nombres de clientes**

El archivo `Seguimiento/rutas (1).xlsx - rutas.csv` expande la tabla de rutas de Pacífico con nombres reales de clientes (plantas, yardas, almacenes), no solo las abreviaturas de ciudades del documento base.

### Rutas significativas nuevas o sin documentar previamente:

| Origen | Destino | Km |
|---|---|---|
| GYSA ASCENCION | FLETES SOTELO | 200 |
| BASE SOTELO CHIHUAHUA | CASETA DE VILLA AHUMADA | 130 |
| DEMINSA SA DE CV | YARDA SOTELO OBREGON | 255 |
| COFICAB LEON / PLANTA JUAREZ | TE CONNECTIVITY HERMOSILLO | 800 |
| FLETES SOTELO | HUNGAROS / NOGALES | 600 |
| GYSA CDJ | FLETES SOTELO | 375 |
| TRANSERVICIOS CHIHUAHUA | TRANSERVICIOS CD JUAREZ | 375 |
| GYSA BACUM | GYSA NAVOJOA | 112 |
| BASE SOTELO CHIHUAHUA | APTIV MOCHIS FV59 | 1,363 |

Estas rutas usan los mismos km base documentados en `pacifico_rules.txt` (ej. JRZ-OBRG=1021, JRZ-GUAMUCHIL=1330), pero ahora están mapeadas con el nombre exacto de las plantas y yardas cliente, lo cual es necesario para automatizar la asignación de km en el sistema.

---

## SECCIÓN 7 — HALLAZGO #6: CICLO DE VIDA DEL DATO — PROCESO FORMALIZADO

> **🆕 PROCESO DOCUMENTADO FORMALMENTE POR PRIMERA VEZ**

El documento `El proceso de foraneo chihuahua.md` es la primera formalización escrita del proceso de nómina de extremo a extremo. Sus 6 etapas son:

1. **Origen Físico** — Operador llena "Formato en Blanco" en carretera: odómetros, rutas, cajas, tickets de diesel. Control adicional: medición de tanques con metro.
2. **Puente Digital (Génesis)** — Administrador filtra por número de unidad (no por nombre, para evitar errores de caligrafía). Solo viajes con estatus **"Terminado" o "Completo"** avanzan.
3. **Folio de Viaje** — Cada coordenada de Génesis se agrupa en un **Boleta/Folio único** para prevenir duplicados. Se aplican códigos R: 1=Cargado, 2=Vacío, 3=PT.
4. **Liquidación de Diesel** — Se usan km tabulados (NO odómetro del camión) ÷ rendimiento mínimo de la unidad = litros permitidos. Diferencia con recarga real × precio/litro = pago al operador.
5. **Ajustes** — Se aplican bonos (Bono Químico $250, Bono Sierra $500) y se aplica la **Deducción de Cruce**.
6. **Reporte Gerencial** — Costo Directo (pago + diesel + peajes + cruces) × 1.63 (costo indirecto 63%) = Costo Total. Facturación – Costo Total = **Utilidad por Flete** y **Utilidad por Camión**.

---

## SECCIÓN 8 — HALLAZGO #7: TIPOS DE MOVIMIENTO EN GÉNESIS

> **🆕 DATO NUEVO — Catálogo de tipos de movimiento**

Del archivo de movimientos de octubre 2025 se identifican los siguientes **Tipos de Movimiento** activos en Génesis que no estaban listados en el documento base:

| Código | Descripción inferida |
|---|---|
| LOC-01 | Local cargado |
| LOC-02 | Local movimiento interno |
| LOC-03 | Local sector 3 (cruce americano) |
| LOC-04 | Local sector 4 |
| PTT-00 | Puro Tractor (PT) |
| MDC-01 | Foráneo Chihuahua principal |
| IMP-02 | Importación |
| EXP-02 | Exportación |
| TRE-02 | Triple cruce o exportación doble |
| TRI-02 | Triple movimiento |
| E-VACIO | Vacío exportación |
| I-VACIO | Vacío importación |
| TRL-00 | Trailer (servicio en planta) |
| S-TER-02 | Servicio terminado cruce |

---

## RESUMEN EJECUTIVO DE HALLAZGOS

| # | Hallazgo | Tipo | Acción Recomendada | Estado |
|---|---|---|---|---|
| 1 | Precio diesel $14.50 (locales/cruce) vs $14.85 (foráneo Chihuahua) | ⚠ Discrepancia | Documentar formalmente ambos precios por tipo de operador | ✅ `DIESEL_PRICE_CHIHUAHUA = 14.85` en `payroll.py` |
| 2 | Bono Químico $250 — no estaba en el documento base | 🆕 Regla nueva | Confirmar condiciones de pago y agregar al documento base | ✅ `BONO_QUIMICO = 250.00` agregado en `payroll.py` — pendiente: condición de activación |
| 3 | Deducción de Cruce — km fronterizo se resta del nacional | 🆕 Regla nueva | Agregar al documento base y al sistema de cálculo | ⚙ Lógica ELP `-40 km` existe; pendiente: validar los 6 casos de combinación |
| 4 | Tabla completa de rendimientos por unidad (5 decimales) | 🆕 Dato nuevo | Usar como catálogo oficial en el sistema | ✅ `UNIT_YIELDS` corregido con valores del CSV oficial (2.37341, groupings ajustados, F-100 agregado) |
| 5 | Tabla de rutas expandida con nombres reales de clientes | 🆕 Dato nuevo | Usar para mapeo automático cliente→km en el sistema | ✅ `ROUTE_DISTANCES_CLIENTS` agregado en `payroll.py`; `get_route_kms` lo consulta primero |
| 6 | Ciclo de vida del dato — 6 etapas formalizadas | 🆕 Proceso nuevo | Usar como base para el diseño del sistema de automatización | 📋 Documentado; etapas 1-4 implementadas, 5-6 parciales |
| 7 | Catálogo de tipos de movimiento de Génesis | 🆕 Dato nuevo | Incorporar al diccionario de datos del sistema | ⚙ LOC/PTT/MDC/IMP/EXP detectados en `is_loaded`; catálogo completo pendiente |

---

## DECISIÓN DE DISEÑO #1 — MODELO DE LIQUIDACIÓN DIESEL: SEMI-AUTOMÁTICO

> **📐 Decisión tomada el 15 de marzo de 2026**

### Principio

El sistema **no calculará ni aplicará automáticamente** el incentivo de diesel al momento de cargar el archivo de Génesis. El cálculo de diesel es un **ajuste fino manual** que realiza el operador de la calculadora con el ticket físico en mano. El sistema solo automatiza la primera parte (mano de obra base) y provee un marco de referencia para que el operador complete la liquidación.

### Flujo de dos etapas

```
ETAPA 1 — AUTOMÁTICA (al subir el archivo de Génesis)
──────────────────────────────────────────────────────
  ✅ Clasificar viajes (Cargado / Vacío / PT)
  ✅ Calcular Mano de Obra Base  ($110 / $55 por leg)
  ✅ Calcular Kms tabulados (tabla de rutas oficial)
  ✅ Calcular Litros Permitidos  (km ÷ rendimiento)
  ✅ Mostrar "Sugerido de Llenado" (ver abajo)
  ⏸ DETENER — esperar input del operador

ETAPA 2 — MANUAL (operador ingresa desde ticket físico)
──────────────────────────────────────────────────────
  🖊 Operador captura: Litros reales recargados (del ticket)
  🖊 Operador captura: Precio real por litro (del ticket)  ← NUEVO CAMPO
  ⚡ Sistema calcula: Ahorro = Litros Permitidos − Litros Reales
  ⚡ Sistema calcula: Incentivo = Ahorro × Precio Real/Litro
  ⚡ Sistema calcula: Total Liquidación = Base + Incentivo + Bonos
```

### Campo "Sugerido de Llenado"

El sistema debe mostrar al operador tres valores de referencia calculados automáticamente a partir de los km tabulados y el rendimiento de la unidad:

| Campo mostrado en pantalla | Fórmula | Propósito |
|---|---|---|
| **Litros Permitidos** | `km_tabulados ÷ rendimiento_unidad` | Límite teórico de consumo eficiente |
| **Costo Esperado** | `Litros_Permitidos × precio_diesel_zona` | Referencia de cuánto debería costar el viaje en diesel |
| **Litros de Empate** *(sugerido)* | `Litros_Permitidos` (mismo valor) | Si el operador cargó exactamente este número, el incentivo es $0 — base de comparación |

> **Nota del auditor:** El "sugerido de llenado" y los "litros permitidos" son el mismo número. El valor de mostrarlo explícitamente es semántico: le dice al operador *"si tu ticket dice más de X litros, hay una pérdida; si dice menos, hay un ahorro"*. Esto convierte el campo en un detector de anomalías en tiempo real.

### Campo nuevo requerido: `Precio Real / Litro`

El operador debe poder ingresar el precio por litro que aparece en el ticket de diesel (puede diferir del precio de referencia del sistema por variaciones de precio de bomba). El sistema usa **ese precio** para calcular el incentivo, no el precio hardcodeado.

```
Incentivo = (Litros_Permitidos − Litros_Reales_Ticket) × Precio_Litro_Ticket
```

Si el operador no ingresa precio, el sistema usa el precio de referencia (`$14.85` Chihuahua / valor Pacífico por definir) como fallback visible.

### Impacto en el código

| Componente | Cambio requerido |
|---|---|
| `payroll.py` → `calculate_chihuahua_payroll` | Eliminar cálculo de `incentive` en la etapa de upload; devolver solo `Allowed_Liters`, `Base_Pay`, `Diesel_Rate` (referencia), `Suggested_Cost` |
| `payroll.py` → `calculate_pacifico_payroll` | Mismo tratamiento |
| `main.py` → `Trip` model | Agregar campo `Manual_Actual_Price_Per_Liter: float = 0.0` |
| `main.py` → `/api/calculate` | Usar `Manual_Actual_Price_Per_Liter` si > 0; si no, usar `Diesel_Rate` de referencia |
| `TripCard.jsx` | Agregar input `Precio / Litro` junto al input de `Litros Recargados`; mostrar campo `Costo Esperado` y `Litros de Empate` como badges de referencia (no editables) |
| `SummaryBar.jsx` | Corregir para leer `Incentive_Pay` del backend, no recalcular localmente |

---

*Reporte generado con base en la comparación de documentos existentes y los nuevos archivos de la carpeta Seguimiento — Marzo 2026*  
*Actualizado con estado de implementación y Decisión de Diseño #1 — 15 de marzo de 2026*
