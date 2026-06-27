# Plan de Ajustes — Revisión Operativa Junio 2026

**Proyecto:** PayrollTool — Nómina Foránea Fletes Sotelo
**Fecha:** 2026-06-11
**Fuente:** Documento "Ajustes Sotelo" (revisión con el cliente) contrastado contra el código actual de `backend/` y `frontend/`
**Estado:** Pendiente de aprobación / decisiones de negocio (ver sección 5)

---

## 1. Contexto

La revisión con el cliente identificó 5 problemas en el cálculo de la nómina. Todos fueron
verificados contra el código actual y se confirmó su causa raíz. Este documento describe
cada ajuste, los archivos a modificar, el orden de implementación y la estimación de tiempo.

Archivos clave de la lógica de cálculo:

| Archivo | Rol |
|---|---|
| `backend/app/Libraries/BoletaProcessor.php` | Agrupa el CSV de Genesis por boleta, clasifica piernas (FCH/PAC), detecta cruces, asigna pago base y precio de diésel |
| `backend/app/Libraries/PayrollCalculator.php` | Calcula el total de la boleta (base + bonos + cruces) |
| `backend/app/Models/TabuladorModel.php` | Resuelve la tarifa de cruce en 4 niveles de especificidad |
| `frontend/src/components/BoletaCard.jsx` | Tarjeta por boleta; hoy **recalcula totales localmente** con fórmulas propias |
| `frontend/src/App.jsx` + `PeriodSelector.jsx` | Filtro por semana de nómina |

---

## 2. Diagnóstico por ajuste

### Ajuste 1 — El total de la boleta ignora el "diésel a favor"

- **Reporte del cliente:** El total solo suma kilometraje y cruces; debe ser **pago base + diésel a favor**.
- **Confirmado en código:** `PayrollCalculator.php:57` neutraliza el diésel explícitamente
  (`$totalIncentive += 0.0; // B-03: Diesel es manual-only`), y `BoletaProcessor.php:203` deja
  `Diesel_A_Favor = null`. La política "manual-only" de Fase 2 se implementó dejando el diésel
  **fuera** del total en lugar de sumarlo una vez capturado manualmente.
- **Ajuste:** Sumar el `Diesel_A_Favor` capturado por viaje al `Total_Pay` en backend, y alinear
  `BoletaCard.jsx:189-209` para que consuma el total del backend en lugar de recalcular.
- **Dependencia:** Ligado al Ajuste 4 (el diésel a favor depende del precio/rendimiento por viaje).

### Ajuste 2 — "Dobleteo" del pago de cruce ($500 duplicado)

- **Reporte del cliente:** El cruce se paga doble: se detecta por nombre de ruta (ej. "Precoz")
  y simultáneamente por coordenadas / diccionario de keywords.
- **Confirmado en código:** El pago de cruce se acumula **por fila** del CSV
  (`PayrollCalculator.php:69`, dentro del `foreach` de Rows), pero `BoletaProcessor.php:127-155`
  marca como cruce **cada pierna** que toque FOK/HAW o El Paso↔Juárez/Zaragoza. Un cruce físico
  real suele venir como 2+ filas (ida + retorno por PRECOS/Zaragoza), y cada fila consulta el
  tabulador y suma su `pago_operador` → $500 × N filas. Además, el nivel 3 del `TabuladorModel`
  ("tipo solo") puede asignar tarifa a filas que no son cruce.
- **Ajuste:** Deduplicar — pagar el cruce **una sola vez por cruce físico** (agrupar las piernas
  del mismo cruce o marcar solo la pierna principal), y revisar que el nivel 3 del tabulador no
  aplique tarifas de cruce a movimientos locales.

### Ajuste 3 — Coordenadas "Tri"/"GT" y rutas base suman pago base indebido

- **Reporte del cliente:** Se aplican $110/$55 a conceptos que no lo llevan (coordenadas "Tri",
  "GT"; rutas base como Zaragoza DTR y Fletes Sotelo).
- **Confirmado en código:** `BoletaProcessor.php:163-167` paga $110/$55 plano a **toda** pierna
  no-Pacífico, sin lista de exclusión. La columna `Coordenada` del CSV se guarda
  (`BoletaProcessor.php:185`) pero nunca participa en la lógica.
- **Ajuste:** Lista de exclusión por coordenada y por origen/destino que ponga `legBasePay = 0`
  en esos casos. Idealmente como catálogo administrable en BD (igual que `pacifico_keywords`)
  para que no quede hardcodeada.

### Ajuste 4 — Rendimiento/precio de diésel debe ser por viaje, no global

- **Reporte del cliente:** A un mismo operador se le paga un viaje a $18.46 y otro a $18.06 o
  $14.85 la misma semana. Hoy es constante general. Se acordó reutilizar el campo visual de
  **"peso"** (sin uso) para capturar el diésel por viaje.
- **Confirmado en código:** El precio se fija por boleta con constantes hardcodeadas
  (`BoletaProcessor.php:215`: `$dieselRate = $isPac ? 16.00 : ($hasForaneo ? 14.85 : 14.50)`).
  En frontend hay además un precio global que aplica a todas las filas. El campo `Peso_Carga`
  existe y siempre está vacío (`BoletaProcessor.php:193`).
- **Ajuste:** Convertir el campo "Peso" de la UI en captura de **precio de diésel por viaje**,
  propagarlo al cálculo del `Diesel_A_Favor` de esa fila y respetarlo en `/api/calculate`.
  Las constantes actuales quedan solo como referencia/fallback visible.

### Ajuste 5 — Semanas rígidas → selector de rango de fechas

- **Reporte del cliente:** El sistema ata el cálculo a semanas estrictas (Semana 22, 43...),
  lo que rompe viajes foráneos que cruzan periodos.
- **Confirmado en código:** Backend asigna `Payroll_Week = semana ISO + 1`
  (`BoletaProcessor.php:263-270`); frontend filtra con `t.Payroll_Week === selectedWeek`
  (`App.jsx:75`, `PeriodSelector.jsx`).
- **Ajuste:** Reemplazar `PeriodSelector` por un selector "de fecha a fecha" y filtrar por
  `Start_Date`/`End_Date` del viaje. `Payroll_Week` se conserva solo como dato informativo.

---

## 3. Orden de implementación y estimación

Los puntos 1 y 4 se implementan juntos (el total depende del diésel por viaje).

| # | Bloque | Archivos principales | Estimación |
|---|--------|---------------------|------------|
| 1 | Diésel por viaje (reusar campo "Peso") | `BoletaProcessor.php`, `PayrollCalculator.php`, `BoletaCard.jsx` | 2–3 días |
| 2 | Total = pago base + diésel a favor; unificar fórmula frontend/backend | `PayrollCalculator.php`, `BoletaCard.jsx`, `TripList.jsx`, `SummaryBar.jsx` | 1–2 días |
| 3 | Dedupe de cruces (1 pago por cruce físico) | `BoletaProcessor.php`, `PayrollCalculator.php`, `TabuladorModel.php` | 1.5–2 días |
| 4 | Exclusiones de pago base (Tri, GT, Zaragoza DTR, Fletes Sotelo) | `BoletaProcessor.php` (+ catálogo admin opcional) | 1 día (2 si es administrable en BD) |
| 5 | Selector de rango de fechas | `App.jsx`, `PeriodSelector.jsx`, `SummaryBar.jsx` | 1.5–2 días |
| 6 | Regresión contra nóminas reales pagadas | casos de prueba + ajustes finos | 2–3 días |

**Total estimado: 9 a 13 días hábiles (~2 a 2.5 semanas) con un desarrollador.**

La validación contra nóminas pagadas (bloque 6) no es opcional en la práctica: los errores
reportados (dobleteo, totales) son del tipo que solo se cierra comparando contra el Excel
histórico (ver `importante/02_reglas_negocio/REVERSE_ENGINEERING_REPORT_2026-04-21.md`).

---

## 4. Riesgos técnicos conocidos

1. **Divergencia frontend/backend:** `BoletaCard.jsx` recalcula totales con fórmulas propias.
   Ejemplo crítico: Bono Doble vale **$1,726** en `BoletaCard.jsx:194` pero **$2,439** en
   `PayrollCalculator.php:119` (este último validado contra nóminas pagadas, regla R-018 del
   RULE_LEDGER). Cualquier ajuste debe consolidar el backend como fuente única de verdad.
2. **Sin tests automatizados** de la lógica de nómina. Se recomienda crear casos de prueba
   PHPUnit con los datos de `importante/05_datos/` como parte del bloque 6.
3. **Ambiente productivo:** confirmar qué versión corre en `nomina-sotelo.dataholics.com.mx`
   (el handover describe el PHP legado; el código activo es CodeIgniter + MySQL). Ver
   `importante/03_planes/PLAN_PRUEBAS_TABULADOR.md` para la conexión del módulo operativo.

---

## 5. Decisiones de negocio pendientes (cerrar antes de implementar)

| # | Pregunta | A quién |
|---|----------|---------|
| 1 | Definición exacta del total: "pago base + diésel a favor" — ¿los cruces y bonos van *dentro* del pago base o son sumandos aparte? Pedir un ejemplo numérico real de una boleta correcta. | Cliente (Fletes Sotelo) |
| 2 | Bono Doble: ¿$1,726 o $2,439? Hoy conviven ambos valores en el sistema. | Cliente / nómina |
| 3 | Regla exacta de deduplicación de cruce: ¿un pago por boleta, por cruce físico, o por folio/coordenada? | Cliente / nómina |
| 4 | Lista definitiva de coordenadas y rutas excluidas del pago base (Tri, GT, Zaragoza DTR, Fletes Sotelo — ¿hay más?). | Cliente / nómina |

---

## 6. Criterios de aceptación

1. El total de boleta = pago base + diésel a favor (según definición cerrada en 5.1), y el
   frontend muestra exactamente el total calculado por backend.
2. Un cruce físico genera exactamente un pago de cruce, validado con boletas reales que antes
   dobleteaban.
3. Movimientos Tri/GT y rutas base no suman pago base.
4. El operador captura el diésel por viaje (campo ex-"peso") y el cálculo lo respeta; sin
   captura, se muestra el precio de referencia como fallback visible.
5. La liquidación se procesa por rango de fechas; viajes que cruzan semanas aparecen completos.
6. Resultados coinciden con casos históricos de control provistos por Fletes Sotelo.
