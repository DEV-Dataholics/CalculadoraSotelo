# Análisis Técnico: Calculadora Foráneo Chihuahua
### Fletes Sotelo · Dataholics · Junio 2026

---

## 1. Contexto y Objetivo

La **Calculadora Foráneo Chihuahua** es una herramienta web que automatiza el cálculo de nómina semanal de los operadores de camión de Fletes Sotelo que operan en la zona Chihuahua–Juárez–El Paso (y en extensión la zona Pacífico). Su propósito es reemplazar hojas de cálculo Excel manuales, propensas a errores, por un sistema estructurado que procesa el CSV exportado del sistema de gestión Genesis.

El reto central del proyecto no fue de programación, sino de **ingeniería de reglas**: las fórmulas de pago nunca estuvieron escritas en un solo documento. Tuvieron que inferirse a partir de múltiples fuentes heterogéneas: transcripciones de entrevistas, archivos Excel de nóminas históricas, tablas de rutas y reglas operativas parciales en texto plano.

---

## 2. La Fórmula General

La fórmula maestra de liquidación es la misma para todos los tipos de operador. Lo que cambia entre releases son los **valores de las variables** y **cuáles subcomponentes se incluyen o excluyen**.

```
TOTAL_BOLETA = PAGO_BASE + DIÉSEL_A_FAVOR + CRUCES + BONOS
```

| Componente | Tipo | Descripción |
|---|---|---|
| `PAGO_BASE` | Variable fija por tramo | $110 (cargado) · $55 (vacío/PT) para FCH. Por km para PAC ($0.30C / $0.15V) |
| `DIÉSEL_A_FAVOR` | Variable calculada | `(Litros_Permitidos − Litros_Reales) × Precio_$/L` |
| `CRUCES` | Variable condicional | Pago único por boleta cuando hay cruce fronterizo internacional |
| `BONOS` | Variables manuales | Bono Químico, Bono Sierra, Bono Doble, Estancias |

### Subcomponentes expandidos

```
LITROS_PERMITIDOS   = Km_Tabulados ÷ Rendimiento_Unidad (5 decimales)
KM_TABULADOS        = Tabla de rutas oficial (NO el odómetro de Génesis)
RENDIMIENTO_UNIDAD  = Valor único por número de unidad (F-002 a F-121)
DIÉSEL_A_FAVOR      = max(0, Litros_Permitidos - Litros_Reales) × Precio_$/L

PAGO_BASE_FCH       = Σ(por pierna) { 110 si cargado | 55 si vacío/PT }
                      EXCEPTO si pierna es excluida (TRI, GT, ZARAGOZA DTR, FLETES SOTELO)

PAGO_BASE_PAC       = Σ(por pierna) { km_ajustados × 0.30 si cargado | km_ajustados × 0.15 si vacío/PT }

CRUCES              = Tarifa_Tabulador_BD si boleta contiene cruce detectado
                      (pagado EXACTAMENTE 1 vez por boleta)
```

---

## 3. Variables del Sistema

### El Diésel como Variable Mensual
> **Nota operativa crítica:** El precio del diésel no es una constante rígida. Para las liquidaciones reales, el departamento de finanzas utiliza **la media del mes (promedio mensual)** como base de cálculo. Los valores de $14.85 (FCH), $14.50 (Local/Cruce) y $16.00 (PAC) actúan como referencias iniciales o promedios históricos en el sistema, pero el valor final se ajusta dinámicamente según dicho promedio mensual.

### Variables de Referencia (catálogos)

| Variable | Valor de Referencia | Fuente de inferencia / Nota |
|---|---|---|
| Precio diésel FCH | $14.85/L | Transcripción Heriberto (referencia base, sujeta a la media del mes) |
| Precio diésel Local/Cruce | $14.50/L | Documento base original (referencia base, sujeta a la media del mes) |
| Precio diésel PAC | $16.00/L | pacifico_rules.txt (referencia base, sujeta a la media del mes) |
| Rendimiento F-002→F-019 | 2.37341 km/L | CSV oficial Unidades rendimiento fCH |
| Rendimiento F-021→F-031, F-033, F-040, F-042 | 2.45098 km/L | CSV oficial |
| Rendimiento F-034→F-036 | 2.60127 km/L | CSV oficial |
| Rendimiento F-045, F-051, F-059, F-069, F-074, F-082, F-100 | 2.11267 km/L | CSV oficial |
| Rendimiento F-111, F-112, F-121 | 2.701058 km/L | CSV oficial |
| Pago base FCH cargado | $110.00 | Confirmado Heriberto y doc. base |
| Pago base FCH vacío/PT | $55.00 | Confirmado |
| Pago base PAC cargado | $0.30/km | Confirmado |
| Pago base PAC vacío/PT | $0.15/km | Confirmado |
| Deducción ELP estándar | −40 km | Inferido de movimientos reales |
| Deducción FOK/HAW | −50 km | Inferido |
| Deducción FOK/HAW + ELP | −90 km | Inferido |

### Variables dinámicas (cambian por boleta o por pierna)

| Variable | Nivel | Quién la captura |
|---|---|---|
| Litros reales recargados | Por boleta | Operador (ticket físico) |
| Precio real $/L | Por pierna (campo Peso_Carga) | Operador (permite sobreescribir la media mensual si es necesario) |
| Clasificación cargado/vacío | Por pierna | Sistema → confirmación manual |
| Bono Químico | Por boleta | Operador (toggle manual) |
| Bono Sierra | Por boleta PAC | Operador (toggle) |
| Bono Doble | Por boleta PAC | Operador (toggle) |
| Estancias Obregón / Mochis | Por boleta PAC | Operador (stepper) |

---

## 4. Evolución por Releases

### Release 0 — MVP Fase 1 (pre-Marzo 2026)
Basado únicamente en el documento base de "Forma de Pago". Primer sistema funcional.

**Implementado:**
- Pago base $110/$55 por tramo FCH
- Pago PAC $0.30/$0.15 por km
- Tabla de km básica por ciudades
- Cálculo automático de litros y diésel incentivo
- Precio diésel: $14.50/L para TODOS los tipos ← error detectado después

**Gaps detectados por finanzas:**
- Precio diésel incorrecto para FCH (debía ser $14.85)
- No había captura del precio real del ticket físico
- El sistema calculaba el incentivo automáticamente — sin opción de capturar litros reales primero
- No existía el Bono Químico
- La tabla de rutas usaba abreviaturas de ciudades, no nombres reales de clientes/plantas
- Rendimientos de unidades con valor único aproximado, no tabla oficial de 5 decimales

---

### Release 1 — Fase 2: Reglas de Seguimiento (Marzo 2026)
**Fuente:** Transcripción de Heriberto + proceso.md + CSV rendimientos + CSV rutas + movimientos oct. 2025.

**Método de inferencia:** Análisis comparativo de 7 fuentes heterogéneas. Se documentaron 7 hallazgos de discrepancia o información nueva.

**Reglas inferidas y confirmadas:**

| Regla | Evidencia textual clave |
|---|---|
| Precio FCH = $14.85/L | "Chihuahua es a 1485. Ese pago sí es fijo." |
| Diésel semi-automático (captura manual) | Flujo 2 etapas diseñado formalmente |
| Bono Químico $250 | "bonos operativos como el Bono Químico de $250" |
| Deducción de Cruce | "filtro de protección... resta km de cruces internacionales" |
| Rendimientos 5 decimales | Tabla CSV oficial (4 grupos de valores) |
| Tabla rutas con nombres reales | YAZAKI COMPONENTES PLANTA 3, APTIV MOCHIS FV59… |
| Solo TERMINADO/COMPLETO/FACTURADO | "solo los viajes marcados como Terminado o Completo avanzan" |

**Gaps pendientes:**
- Condición exacta de Bono Químico → toggle manual provisional
- 6 escenarios completos de deducción de cruce → solo ELP implementado
- Precio del diésel no configurable a nivel de pierna individual

---

### Release 2 — Migración a CodeIgniter 4 + Base de Datos (Junio 2026)

**Cambios estructurales:**
- Tabla `rutas_distancias` en BD (km salen de hardcode)
- Tabla `tabulador_tarifas` para tarifas de cruce (configurable desde admin)
- Tabla `exclusiones_pago_base` para rutas sin pago base
- Campo `Peso_Carga` reutilizado para capturar $/L por pierna
- Deducción de cruce extendida: ELP(−40), FOK/HAW(−50), ambos(−90)
- Bono Doble validado: $2,439 Aptiv Guamúchil / $1,726 solo si cliente Obregón lo solicita

**Gaps detectados en revisión con finanzas:**
- Total de boleta ignoraba el Diésel a Favor en frontend
- Pago de cruce se dobleteaba (coordenadas + nombre de ruta en tabulador)
- TRI, GT, FLETES SOTELO, ZARAGOZA DTR generaban $110/$55 incorrectamente
- Bono Doble mostraba $1,726 en UI (valor incorrecto — validado es $2,439)
- Precio del diésel no se usaba individualmente por row en tiempo real

---

### Release 3 — Correcciones de Revisión con Cliente (Junio 2026)
Basado en tabla de decisiones generada con el cliente en reunión de revisión.

| Fix | Cambio | Archivo |
|---|---|---|
| Total = base + diésel a favor | recalcAndNotify suma totalDieselAFavor | BoletaCard.jsx |
| Cruce = 1 pago por boleta | Solo paga si cruceRow !== null | PayrollCalculator.php |
| Exclusiones en BD | TRI · GT · ZARAGOZA DTR · FLETES SOTELO | ExclusionSeeder → BD |
| Diésel por row individual | Peso_Carga como $/L por pierna | BoletaCard.jsx |
| Bono Doble corregido | $1,726 → $2,439 en frontend | BoletaCard.jsx |

---

## 5. Mapa del Flujo de Cálculo

```
DATOS GÉNESIS (CSV)
    │
    ▼
CLASIFICACIÓN AUTOMÁTICA
    ├── ¿Es Pacífico? (keywords: OBREGON, MOCHIS, GYSA…)
    ├── ¿Es cargado? (FACTURADO > Tipo > Comentarios)
    ├── ¿Hay cruce? (FOK, HAW, ELP en origen/destino)
    └── ¿Km tabulados? (BD → fallback CSV Génesis)

    ▼
PAGO BASE (automático)
    ├── FCH: $110 cargado / $55 vacío — EXCEPTO exclusiones (TRI, GT, ZARAGOZA DTR, FLETES SOTELO)
    └── PAC: km × $0.30 / km × $0.15

    ▼  (pausa — espera input del operador)
CAPTURA MANUAL
    ├── Litros reales recargados (ticket físico)
    └── Precio $/L real por pierna (campo Peso_Carga — puede variar entre piernas)

    ▼
DIÉSEL A FAVOR (por pierna)
    └── max(0, Litros_Permitidos − Litros_Reales) × Precio_$/L_individual

    ▼
AJUSTES MANUALES
    ├── Bono Químico +$250
    ├── Bono Sierra +$500 (PAC)
    ├── Bono Doble +$2,439 (PAC Aptiv Guamúchil)
    ├── Estancia Obregón +$600 (24h)
    └── Estancia Mochis +$300 (cada 6h)

    ▼
CRUCES (1 pago por boleta si hay cruce detectado)
    └── Tarifa desde BD — solo si pierna tiene cruce explícito por coordenadas

    ▼
TOTAL BOLETA = Base + Diésel_A_Favor + Cruce + Bonos
```

---

## 6. Reglas Pendientes de Formalizar

| Regla | Estado | Notas |
|---|---|---|
| Condición exacta de Bono Químico | Pendiente | Implementado como toggle manual. La condición real no fue confirmada aún |
| Bono Doble Obregón $1,726 | Pendiente conf. | Solo si cliente lo solicita explícitamente |
| Escenarios de cruce completos (6 casos) | Parcialmente | 3 de 6 implementados |
| Precio diésel PAC por subzona | Parcialmente | $16.00 default — variaciones por ruta no documentadas |

---

## 7. Lección Central del Proceso

> **El cliente no tenía un manual de reglas.** La fórmula nunca estuvo escrita en un solo lugar.  
> Cada entrega descubrió nuevos edge-cases que el sistema anterior no cubría.  
> El patrón consistente: **a mayor granularidad de los datos revisados, más excepciones aparecieron.**  
> Las reglas base ($110/$55) se estabilizaron primero. Las deducciones de cruce y exclusiones de pago base fueron las últimas, porque solo aparecen en boletas específicas de conductores de la zona fronteriza.

**Fuentes de inferencia por confiabilidad:**
1. Datos históricos validados (nóminas pagadas) → certeza alta
2. Transcripción de entrevista (Heriberto) → certeza alta  
3. Retroalimentación por entrega con finanzas → certeza alta (edge-cases reales)
4. Documentos base de texto plano → certeza media (incompletos, sin edge-cases)
5. Inferencia desde CSV de movimientos → certeza media (requiere validación)

---

*Documento generado: Junio 2026 · Dataholics para Fletes Sotelo*
