#!/usr/bin/env bash
# Captura el golden master haciendo POST al endpoint /api/upload con el CSV de prueba.
# Ejecutar ANTES de cualquier cambio de lógica, con el backend ya en marcha.
#
# Uso:
#   cd backend/
#   php spark serve &                  # arranca API en :8080
#   bash tests/GoldenMasterCapture.sh  # captura la respuesta
#
# El archivo generado (tests/fixtures/golden_master.json) se versiona y
# sirve como referencia para detectar regresiones en los cálculos.

set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"
CSV_FILE="$(dirname "$0")/fixtures/movimientos_genesis.csv"
OUT_FILE="$(dirname "$0")/fixtures/golden_master.json"

if [ ! -f "$CSV_FILE" ]; then
  echo "ERROR: CSV no encontrado en $CSV_FILE" >&2
  exit 1
fi

echo "Capturando golden master desde $API_URL/api/upload ..."
curl -s -X POST \
  -F "file=@$CSV_FILE" \
  "$API_URL/api/upload" \
  | python3 -m json.tool > "$OUT_FILE"

echo "Golden master guardado en: $OUT_FILE"

# Muestra resumen de conductores y totales
echo ""
echo "Resumen:"
python3 - <<'PY'
import json, collections

with open("tests/fixtures/golden_master.json") as f:
    data = json.load(f)

# La respuesta del endpoint es {"trips": [...]}
trips = data.get("trips", data) if isinstance(data, dict) else data
if not isinstance(trips, list):
    print("  (estructura inesperada)")
    import sys; sys.exit(0)

# Agrupar por unidad
by_unit = collections.defaultdict(lambda: {"driver": "?", "base_pay": 0.0, "boletas": 0})
for t in trips:
    unit   = t.get("Unit", "?")
    driver = t.get("Driver", "?")
    pay    = float(t.get("Base_Pay") or 0)
    by_unit[unit]["driver"]   = driver
    by_unit[unit]["base_pay"] += pay
    by_unit[unit]["boletas"]  += 1

total_global = 0.0
for unit, info in sorted(by_unit.items()):
    total_global += info["base_pay"]
    print(f"  {unit:<8} {info['driver']:<35} {info['boletas']:>2} boletas  ${info['base_pay']:>10,.2f}")

print(f"\n  TOTAL BASE_PAY: ${total_global:,.2f}  ({len(trips)} boletas, {len(by_unit)} unidades)")
PY
