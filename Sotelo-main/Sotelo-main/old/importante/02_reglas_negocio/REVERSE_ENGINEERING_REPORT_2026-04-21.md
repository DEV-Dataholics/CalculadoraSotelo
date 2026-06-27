# Reverse Engineering Report (Paid Nominas)

Date: 2026-04-21
Scope: Validate payroll behavior from paid files in Reportes 1, 2, 3 after policy change that diesel recarga and bono de desempeno are manual-only.

## 1) Main Findings

1. Historical FCH payroll sheets include diesel-performance amounts in the paid total.
2. PAC base labor rates are confirmed from paid records (0.30 loaded equivalent, 0.15 empty/PT equivalent).
3. QMS bonus is not a single flat 250 in practice; it behaves like 250 multiplied by QMS-marked movements.
4. PAC Bono Sierra (500) is present in paid data.
5. PAC Doble Operador evidence aligns with 2439-scale behavior (observed 4878), not with 1726 in sampled files.
6. PAC Estancias are paid in 600 blocks (example with 1200 observed).
7. Local Chihuahua payroll uses explicit movement-cost matrix (rampa/guardia/inter/sur/largos) and should remain table-driven.
8. Cruce .xls files are readable now, but the BASE sheet appears repetitive/template-like across weeks 41-45, so confidence on Cruce production rates remains limited.

## 2) Concrete Cross-Checks (Paid Files)

### FCH check
File: Reporte 1 / Foraneo Chihuahua Semana #41.xlsx

Example operator: AGUILAR ESQUIVEL CARLOS
- Total: 12352.050635280582
- Pago por km: 1044.9885
- Diesel a favor: 6840.062135280583
- Cruces: 4467
- Deducciones: 0
- Identity observed: 1044.9885 + 6840.062135280583 + 4467 = 12352.050635280582

This confirms historical paid totals include diesel component.

### PAC check
File: Reporte 1 / Foraneo pacifico semana #41.xlsx

Example operator: GONZALEZ MARTINEZ MAURICIO
- Pago por km line values include 399, 306.3, 153.15 on route legs.
- Summary includes: Pago por km 1596, Diesel a favor 7596.860922507963, Doble operador 4878, Estancias 1200, Bono Sierra 1000.

This supports PAC route-rate model and active bonus/estancia components.

### Local check
File: Reporte 3 / operadores locales por movimiento chihuahua.xlsx
- Matrix confirmed directly in file:
  - Movs rampa = 33
  - Guard/apoy = 40
  - Movs inter y PT = 45
  - Movs inter = 65
  - Movs sur = 90
  - Movs largos = 110
  - Plus estancias + asistencia/rendimiento bonuses

## 3) Policy Alignment (Current)

Policy instruction received: diesel recarga and bono de desempeno are manual capture and must NOT be auto-calculated.

Actionable interpretation:
- Keep diesel-related formulas/rates as historical audit references only.
- Engine payout logic should not auto-compute diesel incentive.
- Manual values can still be stored for traceability, but excluded from automatic totaling logic.

## 4) Risks / Open Gaps

1. Cruce week files (sem#41..45) appear structurally repetitive; may not represent finalized paid output.
2. Exact trigger mechanics for QMS counting still need one canonical definition (per leg vs per folio pair).
3. Doble operador branch logic (1726 vs 2439) needs a deterministic route/client rule.
4. Estancia Mochis/Guamuchil granularity (per 6h vs per night) remains unresolved.

## 5) Artifacts Updated

- Updated: .agent/RULE_LEDGER.md
  - Diesel section re-scoped to manual-only
  - PAC/FCH findings reflected in confidence and status updates
  - Added findings section from paid nomina evidence
- Updated extractor: tmp_extract_nominas.py
  - Added xlrd support to parse legacy .xls Cruce files
- Added this report: .agent/REVERSE_ENGINEERING_REPORT_2026-04-21.md
