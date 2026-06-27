# RULE LEDGER — Fletes Sotelo Payroll System
> Maintained by: Transportation Logic Deconstructor persona  
> Location: `proyectos/Calculadoras Sotelo/.agent/RULE_LEDGER.md`  
> Created: 2026-04-20 | Last updated: 2026-04-21

---

## HOW TO READ THIS LEDGER

| Field | Meaning |
|---|---|
| **Status** | `candidate` → plausible but unconfirmed · `testing` → in code, needs validation · `approved` → confirmed by ≥2 independent sources + verified in production data · `manual-only` → captured by assistant in payroll sheet, not auto-calculated by engine · `rejected` → disproved |
| **Confidence** | 0–39 weak · 40–69 plausible · 70–84 strong · 85–100 approved-ready |
| **Segment** | `LOCAL` · `CRUCE` · `FCH` (Foráneo Chihuahua) · `PAC` (Foráneo Pacífico) · `ALL` |

---

## SECTION A — MANO DE OBRA (Base Labor Pay)

---

### R-001 · FCH Leg Cargado — $110.00
| Attribute | Value |
|---|---|
| **Segment** | FCH |
| **Status** | approved |
| **Confidence** | 97 |
| **Formula** | `Base_Pay += 110.00` per Cargado leg |
| **Activation** | Genesis status = "Terminado" or "Completo"; movement code R=1 |
| **Evidence** | `payroll.py: RATE_CHIHUAHUA_LOADED = 110.00` · `REPORTE_HALLAZGOS.md §1` · `El proceso de foraneo chihuahua.md` · `TRANSCRIPCION HERIBERTO` ("$110 cargado") |
| **Exceptions** | None documented |
| **Revision** | 2026-04-20 — Initial entry |

---

### R-002 · FCH Leg Vacío — $55.00
| Attribute | Value |
|---|---|
| **Segment** | FCH |
| **Status** | approved |
| **Confidence** | 97 |
| **Formula** | `Base_Pay += 55.00` per Vacío leg |
| **Activation** | Genesis status = "Terminado" or "Completo"; movement code R=2 |
| **Evidence** | `payroll.py: RATE_CHIHUAHUA_EMPTY = 55.00` · `REPORTE_HALLAZGOS.md §1` · `El proceso de foraneo chihuahua.md` · `TRANSCRIPCION HERIBERTO` |
| **Exceptions** | None documented |
| **Revision** | 2026-04-20 — Initial entry |

---

### R-003 · FCH PT (Puro Tractor) — $55.00
| Attribute | Value |
|---|---|
| **Segment** | FCH |
| **Status** | testing |
| **Confidence** | 80 |
| **Formula** | `Base_Pay += 55.00` per PT leg |
| **Activation** | Genesis movement code R=3; movement types PTT-00 or similar |
| **Evidence** | `El proceso de foraneo chihuahua.md` ("3. PT — Puro Tractor: $55.00") · `REPORTE_HALLAZGOS.md §1` (Vacío/PT share same rate) |
| **Exceptions** | Policy doc implies PT is distinct from Vacío in intent, though the rate is identical. Local/Cruce PT is paid differently (by liters, not flat rate). |
| **Revision** | 2026-04-20 — Initial entry. Confidence 80 (not 97) because condition under which FCH PT applies versus local PT rule has not been validated with live data. |

---

### R-004 · PAC Leg Cargado — km × $0.30
| Attribute | Value |
|---|---|
| **Segment** | PAC |
| **Status** | approved |
| **Confidence** | 93 |
| **Formula** | `Base_Pay = km_tabulados × 0.30` |
| **Activation** | Manual flag `Pac_Loaded = true` (operator input required) |
| **Evidence** | `payroll.py: rate = 0.30 if Manual_Pac_Loaded` · `REPORTE_HALLAZGOS.md §1` · `TRANSCRIPCION HERIBERTO` ("$0.30 por km Pacífico cargado") |
| **Exceptions** | Cannot be auto-classified from Genesis — operator must confirm cargado status manually |
| **Revision** | 2026-04-21 — Validated against paid nominas (`Foraneo pacifico semana #41.xlsx` to `#45.xlsx`): column `Q` shows exact route rates (e.g., 399, 306.3, 153.15), matching km-based loaded logic. |

---

### R-005 · PAC Leg Vacío / PT — km × $0.15
| Attribute | Value |
|---|---|
| **Segment** | PAC |
| **Status** | approved |
| **Confidence** | 91 |
| **Formula** | `Base_Pay = km_tabulados × 0.15` |
| **Activation** | `Pac_Loaded = false` (default when not confirmed cargado) |
| **Evidence** | `payroll.py: rate = 0.15 if not Manual_Pac_Loaded` · `REPORTE_HALLAZGOS.md §1` · `TRANSCRIPCION HERIBERTO` |
| **Exceptions** | Same manual input risk as R-004 |
| **Revision** | 2026-04-21 — Validated in paid pacifico sheets: empty/PT-type legs are consistently paid at half-rate equivalents (e.g., 153.15 where full leg is 306.3). |

---

### R-006 · LOCAL/CRUCE Viajes — Lookup Table (base $500 equivalencia)
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | candidate |
| **Confidence** | 58 |
| **Formula** | Lookup by decimal viaje value. Base equivalencia = $500 per full trip, **except 0.50 decimal = $150 (not $250 — anomalous)** |
| **Lookup Table** | **DISPUTED by paid files.** Legacy docs show a $500-equivalent table, but `Nomina O.P Cruce sem#41..45.xls` `BASE` sheet shows operational table values centered at `1.0→$450` plus punctuality-adjusted variants (`1.0→$385`, `1.0→$375`). |
| **Evidence** | `FORMA DE PAGO.txt §Operadores Locales` · `FORMA DE PAGO.txt §Operadores de Cruce` (identical tables) |
| **Exceptions** | Current paid Cruce files appear template-like and repeated across weeks, so this remains unresolved. Do not hardcode $500-based table until a clean local/cruce paid period is confirmed. |
| **Revision** | 2026-04-21 — Confidence lowered after direct file evidence conflict. |

---

### R-007 · LOCAL/CRUCE PT — Paid per Liter at $14.50
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | candidate |
| **Confidence** | 82 |
| **Formula** | `PT_Pay = liters × 14.50` |
| **Evidence** | `FORMA DE PAGO.txt` ("movimientos en pt se paga en base a litros de diésel, $14.50 pesos por litro") |
| **Exceptions** | Liters come from fuel ticket, not calculation. Different model from FCH PT (which uses flat $55/leg). |
| **Revision** | 2026-04-20 — Initial entry |

---

## SECTION B — DIESEL / RENDIMIENTO (MANUAL-ONLY SCOPE)

Policy update (user directive): recarga de diesel and bono de desempeno are now captured manually by payroll assistant and must NOT be auto-calculated by the engine.

---

### R-008 · Diesel Reference Price — FCH Zone: $14.85/L
| Attribute | Value |
|---|---|
| **Segment** | FCH |
| **Status** | manual-only |
| **Confidence** | 93 |
| **Formula** | Reference only for manual capture; no auto-calculation in payroll engine |
| **Evidence** | `payroll.py: DIESEL_PRICE_CHIHUAHUA = 14.85` · `El proceso de foraneo chihuahua.md` ("$14.85 pesos por litro en la zona Chihuahua") · `TRANSCRIPCION HERIBERTO` ("Chihuahua es a 1485 [sic]") |
| **Exceptions** | Per Design Decision #1: if operator enters actual pump price from ticket, that overrides this reference. This value is the fallback only. |
| **Revision** | 2026-04-21 — Re-scoped to manual-only per policy change. |

---

### R-009 · Diesel Reference Price — Local/Cruce Zone: $14.50/L
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | manual-only |
| **Confidence** | 88 |
| **Formula** | Reference only for manual capture; no auto-calculation in payroll engine |
| **Evidence** | `FORMA DE PAGO.txt` ("$14.50 pesos por litro") · `REPORTE_HALLAZGOS.md §2` (confirms $14.50 for local/cruce vs $14.85 for FCH) |
| **Exceptions** | Same override logic as R-008: actual ticket price takes precedence |
| **Revision** | 2026-04-21 — Re-scoped to manual-only per policy change. |

---

### R-010 · Allowed Liters Formula
| Attribute | Value |
|---|---|
| **Segment** | FCH, PAC |
| **Status** | manual-only |
| **Confidence** | 96 |
| **Formula** | `Litros_Permitidos = km_tabulados / unit_yield` (5-decimal precision required) |
| **Evidence** | `payroll.py` (implemented) · `El proceso de foraneo chihuahua.md` ("km tabulados ÷ rendimiento mínimo de la unidad") · `REPORTE_HALLAZGOS.md §4` ("rendimiento mínimo con 5 decimales es obligatorio") |
| **Exceptions** | Uses tabulados km (route table), NOT odometer reading. Yield must be exact to 5 decimal places or calculated totals diverge. |
| **Revision** | 2026-04-21 — Formula retained only as audit/reference; no automatic use in payout calculation. |

---

### R-011 · Diesel Incentive Formula
| Attribute | Value |
|---|---|
| **Segment** | FCH, PAC |
| **Status** | manual-only |
| **Confidence** | 90 |
| **Formula** | Historical reference only. Must not be auto-calculated in current scope. |
| **Activation** | Stage 2 only — operator must enter `Litros_Reales` and `Precio_Litro` from physical ticket |
| **Evidence** | `main.py: incentive = savings * Diesel_Rate` · `REPORTE_HALLAZGOS.md Design Decision #1` · `El proceso de foraneo chihuahua.md §4` |
| **Exceptions** | Incentive cannot be negative (driver does NOT pay back overage through this field — that is handled by end-of-week fuel charge, see R-019). If operator does not enter price, use R-008/R-009 as fallback. |
| **Revision** | 2026-04-21 — Historical paid nominas still contain this component, but forward policy is manual capture only. |

---

### R-012 · Unit Yield Table (4 tiers, 5-decimal precision)
| Attribute | Value |
|---|---|
| **Segment** | FCH |
| **Status** | manual-only |
| **Confidence** | 95 |
| **Tiers** | `2.11267` → F-045, F-051, F-059, F-069, F-074, F-082, F-100 · `2.37341` → F-002–F-019, F-050, F-060–F-063, F-086–F-092, F-097–F-099, F-107, F-108, F-110 · `2.45098` → F-021–F-031, F-033, F-040, F-042 · `2.60127` → F-034, F-035, F-036 |
| **Default** | `2.37341` for any unit not in table |
| **Evidence** | `payroll.py: UNIT_YIELDS` · `Seguimiento/Unidades rendimiento fCH - Hoja 1.csv` (authoritative source) · `FORMA DE PAGO.txt §Foráneo Chihuahua` (unit list) |
| **Exceptions** | Group 5 (F-111, F-112, F-121 at `2.701058`) present in `payroll.py` — not yet in official CSV. Treat as provisional until confirmed. |
| **Revision** | 2026-04-21 — Retained for reconciliation/audit only after diesel manual-scope policy. |

---

## SECTION C — DEDUCTIONS

---

### R-013 · ELP Cruce Deduction — km − 40 on Border Routes
| Attribute | Value |
|---|---|
| **Segment** | FCH |
| **Status** | testing |
| **Confidence** | 74 |
| **Formula** | `km_adjusted = km_tabulados − 40` when origin OR destination contains "RIO BRAVO", "EL PASO", or "ZARAGOZA" AND `km_tabulados > 50` |
| **Evidence** | `payroll.py: ELP deduction logic` · `REPORTE_HALLAZGOS.md §3` ("se resta el kilometraje de los cruces internacionales") · `El proceso de foraneo chihuahua.md §5` · `TRANSCRIPCION HERIBERTO` ("el cruce se paga por separado") |
| **Known exceptions / gaps** | 6 identified route combinations not fully validated: (1) JRZ→CHIH, (2) CHIH→JRZ, (3) ELP→CHIH, (4) ELP→CHIH Fokker/Haer, (5) ELP→plantas afueras→JRZ, (6) inverses. Exact 40 km figure is approximate — derived from code, not confirmed in written policy. |
| **Revision** | 2026-04-20 — Initial entry. Confidence 74 (strong but not approved) because the exact deduction amount and all 6 case combinations have not been verified against real payroll data. |

---

### R-014 · LOCAL End-of-Week Fuel Charge
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | manual-only |
| **Confidence** | 68 |
| **Formula** | `Deduction = end_of_week_fuel_loaded × 14.50` |
| **Evidence** | `FORMA DE PAGO.txt §Locales` ("al fin de la semana la cantidad carga se multiplica por $14.50 y se descuenta el total") |
| **Exceptions** | This is the mechanism that compensates for positive incentive balances — fuel consumption is tracked weekly, not per-trip. Not implemented in current codebase. |
| **Revision** | 2026-04-21 — Re-scoped to manual-only due to diesel policy update. |

---

## SECTION D — BONOS (Flat Bonuses)

---

### R-015 · Bono Químico — $250.00
| Attribute | Value |
|---|---|
| **Segment** | FCH (possibly PAC — unconfirmed) |
| **Status** | testing |
| **Confidence** | 86 |
| **Formula** | `Bono_Pay += 250.00 × count(QMS-marked movements)` |
| **Activation** | Triggered by QMS-marked movements in operator sheet (observed in historical paid nominas) |
| **Evidence** | `payroll.py: BONO_QUIMICO = 250.00` · `El proceso de foraneo chihuahua.md §5` ("Bono Químico $250.00 si se cumplen las reglas") · `REPORTE_HALLAZGOS.md §2` |
| **Exceptions** | In paid data this behaves as a multiplier (e.g., 1000, 1500), not a single flat one-off event. |
| **Open question** | Exact counting rule for `QMS` tags (per leg vs per folio pair) still needs strict normalization. |
| **Revision** | 2026-04-21 — Upgraded after reverse-engineering from paid nominas in `Reporte 1`. |

---

### R-016 · Bono Sierra (Pacífico) — $500.00
| Attribute | Value |
|---|---|
| **Segment** | PAC |
| **Status** | approved |
| **Confidence** | 90 |
| **Formula** | `Bono_Pay += 500.00` |
| **Activation** | Manual toggle; route passes through "Sierra" corridor |
| **Evidence** | `main.py: Bono_Sierra += 500` · `REPORTE_HALLAZGOS.md §1` · `El proceso de foraneo chihuahua.md §5` |
| **Exceptions** | "Sierra" is not automatically detectable from Genesis route fields — requires operator confirmation. Exact Sierra route definitions not documented. |
| **Revision** | 2026-04-21 — Observed directly in paid pacifico nominas (`BONO DE LA SIERRA` line item = 500). |

---

### R-017 · Bono Doble Operador Obregón — $1,726.00
| Attribute | Value |
|---|---|
| **Segment** | PAC |
| **Status** | candidate |
| **Confidence** | 64 |
| **Formula** | `Bono_Pay += 1726.00` |
| **Activation** | Client explicitly requests it; Obregón-based route |
| **Evidence** | `main.py: Bono_Doble += 1726` · `REPORTE_HALLAZGOS.md §1` ("solo si cliente lo solicita") · `pacifico_rules.txt` |
| **Exceptions** | Client-triggered only — must not be auto-applied. |
| **Revision** | 2026-04-21 — Lowered confidence: paid pacifico samples show `DOBLE OPERADOR` amount 4878, which aligns with 2439×2 rather than 1726. |

---

### R-018 · Bono Doble Operador Guamúchil (Aptiv) — $2,439.00
| Attribute | Value |
|---|---|
| **Segment** | PAC |
| **Status** | testing |
| **Confidence** | 86 |
| **Formula** | `Bono_Pay += 2439.00` |
| **Activation** | 24-hour Guamúchil → Juárez route with Aptiv cargo |
| **Evidence** | `REPORTE_HALLAZGOS.md §1` ("Bono Doble Operador Aptiv Guamúchil = $2,439.00") · `pacifico_rules.txt` |
| **Exceptions** | Paid pacifico week data contains `DOBLE OPERADOR = 4878`, consistent with `2439 × 2`. This strongly suggests the Guamúchil/Aptiv rate is active in production. |
| **Revision** | 2026-04-21 — Upgraded after paid-data validation. |

---

### R-019 · Bono 12 Horas — $350.00
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | candidate |
| **Confidence** | 65 |
| **Formula** | `Bono_Pay += 350.00` |
| **Activation** | Operator works ≥12 hrs/day on weekdays AND ≥6 hrs on Saturday |
| **Evidence** | `FORMA DE PAGO.txt §Bono 12 Horas` |
| **Exceptions** | Not in codebase. Requires time-tracking data from Genesis — unclear if `Arranque`/`Arribo` timestamps are sufficient to compute daily hours. |
| **Revision** | 2026-04-20 — Candidate. No code implementation. |

---

### R-020 · Bono de Producción — $400.00
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | candidate |
| **Confidence** | 60 |
| **Formula** | `Bono_Pay += 400.00` when `sum(viaje_decimals) >= 20` in the period |
| **Activation** | Weekly cumulative sum of viaje decimals reaches 20 |
| **Evidence** | `FORMA DE PAGO.txt §Bono de Producción` |
| **Exceptions** | "La suma de todos sus decimales la suma de 20" — threshold is 20 decimal units per week. No code implementation. Aggregation window (daily? weekly?) not confirmed. |
| **Revision** | 2026-04-20 — Candidate |

---

### R-021 · Bono Aduana (100% Americana / Rojo Mexicana) — $230.00
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | candidate |
| **Confidence** | 58 |
| **Formula** | `Bono_Pay += 230.00` per customs inspection event |
| **Activation** | Operator receives 100% US customs inspection OR Mexican "rojo" screening |
| **Evidence** | `FORMA DE PAGO.txt §Rojo aduana mexicana` |
| **Exceptions** | Event-based (per inspection, not per trip). Cannot be derived from Genesis data — must be manually toggled. |
| **Revision** | 2026-04-20 — Candidate |

---

### R-022 · Bono Amarres y Enlones — $450.00
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | candidate |
| **Confidence** | 58 |
| **Formula** | `Bono_Pay += 450.00` per platform tiedown/tarping operation |
| **Activation** | Only applies to platform trailer loads; covers full cycle: amarre + enlone + desamarre + desenlone |
| **Evidence** | `FORMA DE PAGO.txt §Amarres y Enlones` |
| **Exceptions** | Platform-specific. Cannot be derived from Genesis movement type alone. |
| **Revision** | 2026-04-20 — Candidate |

---

### R-023 · Bono Diésel Sábado / Festivo — $175.00 × viajes_decimales
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | candidate |
| **Confidence** | 72 |
| **Formula** | `Bono_Pay += viajes_decimales × 175.00` for trips made on Saturday or public holiday |
| **Example** | 1.0 viaje on Saturday → $175.00 · 1.25 viajes → $218.75 |
| **Evidence** | `FORMA DE PAGO.txt §Bono diésel` (table: 0.25→$43.75, 0.50→$87.50 … linear at $175 per decimal) |
| **Exceptions** | Not in codebase. Requires day-of-week from Genesis `Arranque` timestamp. |
| **Revision** | 2026-04-20 — Candidate. Note: this is linear (× $175), unlike the base viaje table (R-006) which has a nonlinear anomaly at 0.50. |

---

## SECTION E — ESTANCIAS (Waiting Pay)

---

### R-024 · Estancia Base (at Fletes Sotelo yard) — Table from $70/2hrs
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | candidate |
| **Confidence** | 75 |
| **Formula** | Lookup by hours idle: `2hrs→$70 · 3hrs→$140 · 4hrs→$210 · 5hrs→$280 · 6hrs→$350 · 7hrs→$420 · 8hrs→$480 · 9hrs→$550 · 10hrs→$620` |
| **Activation** | Idle time at Fletes Sotelo yard ≥ 2 hours; first idle hour is not paid |
| **Evidence** | `FORMA DE PAGO.txt §Estancias` (Local and Cruce sections identical) |
| **Exceptions** | 9-hr rate ($550) is non-linear (expected $560 if $70/hr): likely intentional discount. Must use lookup table. Idle time detection requires `Arranque`/`Arribo` delta — not currently computed in backend. |
| **Revision** | 2026-04-20 — Candidate |

---

### R-025 · Estancia Cliente (at customer warehouse) — Table from $120/2hrs
| Attribute | Value |
|---|---|
| **Segment** | LOCAL, CRUCE |
| **Status** | candidate |
| **Confidence** | 75 |
| **Formula** | Lookup: `2hrs→$120 · 3hrs→$240 · 4hrs→$360 · 5hrs→$480 · 6hrs→$600 · 7hrs→$720 · 8hrs→$840 · 9hrs→$960 · 10hrs→$1,080` |
| **Activation** | Idle time at customer location ≥ 2 hours; first hour not paid |
| **Evidence** | `FORMA DE PAGO.txt §Estancias` |
| **Exceptions** | Perfectly linear at $120/hr for billing purposes. Same idle time detection issue as R-024. Whether "customer location" is auto-detectable from Genesis `Destino` field is unknown. |
| **Revision** | 2026-04-20 — Initial entry |

---

### R-026 · Estancia Obregón (Pacífico long-haul) — $600.00 / 24 hrs
| Attribute | Value |
|---|---|
| **Segment** | PAC |
| **Status** | approved |
| **Confidence** | 90 |
| **Formula** | `Estancia_Pay += 600.00` per 24-hour detention period in Obregón |
| **Evidence** | `main.py: Estancia_Obrg += 600 per night` · `REPORTE_HALLAZGOS.md §1` · `pacifico_rules.txt` |
| **Exceptions** | Different time unit than Local/Cruce estancias (24 hrs vs 2-hr blocks). Not auto-calculated — operator enters number of nights. |
| **Revision** | 2026-04-21 — Paid pacifico nominas show `ESTANCIAS` values matching multiples of 600 (e.g., 1200). |

---

### R-027 · Estancia Mochis / Guamúchil (Pacífico) — $300.00 / 6 hrs
| Attribute | Value |
|---|---|
| **Segment** | PAC |
| **Status** | testing |
| **Confidence** | 83 |
| **Formula** | `Estancia_Pay += 300.00` per 6-hour detention block at Los Mochis or Guamúchil |
| **Evidence** | `main.py: Estancia_Mochis += 300 per night` · `pacifico_rules.txt` · `REPORTE_HALLAZGOS.md §1` |
| **Exceptions** | Described as "c/6 hrs" in hallazgos — per 6-hr block, not per night. `main.py` label says "per night". Possible mismatch in granularity. |
| **Revision** | 2026-04-20 — Initial entry. **Conflict flagged**: hallazgos says every 6 hrs, code says per night. Requires clarification. |

---

## SECTION F — COST REPORTING (Not Operator Pay)

---

### R-028 · Administrative Indirect Cost Multiplier — 63%
| Attribute | Value |
|---|---|
| **Segment** | ALL |
| **Status** | approved |
| **Confidence** | 91 |
| **Formula** | `Total_Cost = Direct_Cost × 1.63` |
| **Evidence** | `REPORTE_HALLAZGOS.md §1` ("63% sobre costo directo operativo") · `El proceso de foraneo chihuahua.md §6` · `TRANSCRIPCION HERIBERTO` |
| **Exceptions** | Applied at report level only — does not affect operator payment. Used to derive `Utilidad por Flete` and `Utilidad por Camión` for management dashboards. |
| **Revision** | 2026-04-20 — Initial entry |

---

## SECTION H — REVERSE-ENGINEERING FINDINGS (Paid Nominas)

### F-001 · Historical FCH Totals Include Diesel Component
| Attribute | Value |
|---|---|
| **Finding** | Confirmed |
| **Evidence** | In `Foraneo Chihuahua Semana #41.xlsx`, operator sheets satisfy `TOTAL = PAGO POR KM + DIESEL A FAVOR + CRUCES + BONOS + ESTANCIAS - DEDUCCIONES` (e.g., AGUILAR, BALLEZA, ONTIVEROS). |
| **Impact** | Historical paid files include performance/diesel logic, but forward policy is manual capture only (Section B). |

---

### F-002 · PAC Rate Card Validated in Paid Data
| Attribute | Value |
|---|---|
| **Finding** | Confirmed |
| **Evidence** | `Foraneo pacifico semana #41.xlsx` shows route-line `PAGO POR KM` values 399.0, 306.3, 153.15 consistent with known Pacifico km-rate model. |
| **Impact** | Supports approval of R-004 and R-005. |

---

### F-003 · Local Chihuahua Uses Movement-Cost Matrix (Not FCH/PAC Model)
| Attribute | Value |
|---|---|
| **Finding** | Confirmed |
| **Evidence** | `operadores locales por movimiento chihuahua.xlsx` uses explicit costs: rampa 33, guar/apoy 40, inter/PT 45, inter 65, sur 90, largos 110, plus estancias/bonos. |
| **Impact** | Local payroll must stay table-driven and separate from FCH/PAC formulas. |

---

## SECTION G — DATA PROCESSING RULES (Non-Pay)

These are rules that govern how raw Genesis data is transformed before any pay calculation.

---

### D-001 · Valid Genesis Status Filter
| Attribute | Value |
|---|---|
| **Status** | approved |
| **Confidence** | 96 |
| **Rule** | Only Genesis trips with status **"Terminado"** or **"Completo"** advance to payroll |
| **Evidence** | `El proceso de foraneo chihuahua.md §2` · `REPORTE_HALLAZGOS.md §1` |
| **Exceptions** | Any other status (En Tránsito, Cancelado, etc.) halts the payroll pipeline for that trip |

---

### D-002 · Unit Number Filter (not driver name)
| Attribute | Value |
|---|---|
| **Status** | approved |
| **Confidence** | 94 |
| **Rule** | Trips must be filtered by **unit number** (e.g., F-019), not by driver name, to avoid errors from handwriting variants |
| **Evidence** | `El proceso de foraneo chihuahua.md §2` |

---

### D-003 · Trip Bundling — Hub Return Closes a Folio
| Attribute | Value |
|---|---|
| **Status** | testing |
| **Confidence** | 78 |
| **Rule** | Individual Genesis movements are grouped into a single payroll folio. A folio closes when the unit returns to a hub: origin or destination contains "JUAREZ", "JRZ", "BASE SOTELO", "EL PASO", or "PRECOS" |
| **Evidence** | `payroll.py: bundle_movements()` · `El proceso de foraneo chihuahua.md §3` |
| **Exceptions** | Pacífico trips have different hub return points (e.g., OBREGON, GUAMUCHIL). Bundling logic may need segment-specific hub lists. |

---

### D-004 · Valid Coordenada Técnica Format
| Attribute | Value |
|---|---|
| **Status** | candidate |
| **Confidence** | 68 |
| **Rule** | Genesis coordenada must contain a hyphen (format: `NNNNNNN-N`) to be considered valid and advance to payroll |
| **Evidence** | `El proceso de foraneo chihuahua.md §2` ("extrae los fletes validando la Coordenada Técnica, que debe contener un guion") |
| **Exceptions** | Format not validated in current code. |

---

### D-005 · Tabulados km — Override Odometer
| Attribute | Value |
|---|---|
| **Status** | approved |
| **Confidence** | 95 |
| **Rule** | All diesel and pay calculations use pre-defined route km from the route table — **never** the odometer reading reported by the driver |
| **Evidence** | `El proceso de foraneo chihuahua.md §4` ("el sistema ignora el odómetro del camión y utiliza las distancias estandarizadas") · `payroll.py: get_route_kms()` |

---

## SUMMARY DASHBOARD

| Status | Count | Rules |
|---|---|---|
| **approved** | 10 | R-001, R-002, R-004, R-005, R-016, R-026, R-028, D-001, D-002, D-005 |
| **testing** | 6 | R-003, R-013, R-015, R-018, R-027, D-003 |
| **candidate** | 11 | R-006, R-007, R-017, R-019, R-020, R-021, R-022, R-023, R-024, R-025, D-004 |
| **manual-only** | 6 | R-008, R-009, R-010, R-011, R-012, R-014 |
| **rejected** | 0 | — |

---

## OPEN QUESTIONS TRACKER

| # | Question | Blocking Rule | Priority |
|---|---|---|---|
| OQ-1 | Exact counting rule for `QMS` bonus events (per leg vs per paired folio)? | R-015 | HIGH |
| OQ-2 | Exact km deducted per cruce scenario (validate all 6 cases vs real data) | R-013 | HIGH |
| OQ-3 | Is Estancia Mochis $300 per 6-hr block or per night? (`main.py` vs `REPORTE_HALLAZGOS`) | R-027 | MEDIUM |
| OQ-4 | When is Obregón `1726` used vs Guamúchil `2439` in double-operator cases? | R-017, R-018 | MEDIUM |
| OQ-5 | Which local/cruce payout table is active in current operation: $500-equivalent docs or $450/$385/$375 matrix seen in .xls base sheet? | R-006 | HIGH |
| OQ-6 | What is the aggregation window for Bono de Producción (weekly sum ≥20 decimales)? | R-020 | LOW |
| OQ-7 | Should diesel manual capture remain in sheets only, or be persisted as audit metadata in backend without payout math? | R-008..R-012 | MEDIUM |

---

*Rule Ledger v1.0 — Generated 2026-04-20 from: `payroll.py`, `FORMA DE PAGO PARA LOS DIFERENTES TIPOS DE OPERADORES FLETES SOTELO (2).txt`, `REPORTE_HALLAZGOS_NUEVAS_REGLAS.md`, `El proceso de foraneo chihuahua.md`, `pacifico_rules.txt`*
