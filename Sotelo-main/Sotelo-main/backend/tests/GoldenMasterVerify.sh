#!/usr/bin/env bash
# Verifica que la API actual produce exactamente el mismo resultado que el golden master.
# Falla con código de salida != 0 si hay cualquier diferencia.
#
# Uso:
#   bash tests/GoldenMasterVerify.sh
#
# Se puede integrar en CI como paso previo al merge.

set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"
CSV_FILE="$(dirname "$0")/fixtures/movimientos_genesis.csv"
MASTER_FILE="$(dirname "$0")/fixtures/golden_master.json"
TMP_FILE="$(mktemp /tmp/sotelo_gm_current_XXXX.json)"

trap "rm -f $TMP_FILE" EXIT

if [ ! -f "$MASTER_FILE" ]; then
  echo "ERROR: golden_master.json no existe. Ejecuta GoldenMasterCapture.sh primero." >&2
  exit 1
fi

echo "Llamando API para verificación..."
curl -s -X POST -F "file=@$CSV_FILE" "$API_URL/api/upload" \
  | python3 -m json.tool > "$TMP_FILE"

# Comparar solo los campos numéricos críticos (tolerancia $0.00)
python3 - "$MASTER_FILE" "$TMP_FILE" <<'PY'
import json, sys

def extract_pays(path):
    with open(path) as f:
        raw = json.load(f)
    drivers = raw
    if isinstance(raw, dict):
        drivers = raw.get("data", raw.get("trips", raw.get("boletas", [])))
    result = {}
    for d in (drivers if isinstance(drivers, list) else []):
        key = (d.get("Unit") or d.get("unit", "?"))
        result[key] = {
            "Total_Pay":   float(d.get("Total_Pay")   or d.get("total_pay", 0)),
            "Base_Pay":    float(d.get("Base_Pay")    or d.get("base_pay", 0)),
            "Diesel_Pay":  float(d.get("Diesel_Pay")  or d.get("diesel_pay", 0) or 0),
        }
    return result

master  = extract_pays(sys.argv[1])
current = extract_pays(sys.argv[2])

errors = []
for unit, vals in master.items():
    if unit not in current:
        errors.append(f"  MISSING unit {unit}")
        continue
    for field, expected in vals.items():
        got = current[unit].get(field, 0)
        if abs(expected - got) > 0.005:
            errors.append(f"  {unit}.{field}: esperado ${expected:,.2f}, obtenido ${got:,.2f}  (diff ${got-expected:+,.2f})")

for unit in current:
    if unit not in master:
        errors.append(f"  EXTRA unit {unit} (no estaba en golden master)")

if errors:
    print("GOLDEN MASTER FAIL — diferencias encontradas:")
    for e in errors:
        print(e)
    sys.exit(1)
else:
    print(f"GOLDEN MASTER OK — {len(master)} unidades, 0 diferencias.")
PY
