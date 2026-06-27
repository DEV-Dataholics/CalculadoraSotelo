import glob
import os
import xlrd

BASE = r"c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Calculadoras Sotelo\Reportes"
files = sorted(
    glob.glob(os.path.join(BASE, "Reporte 2", "Nomina O.P Cruce*.xls"))
    + glob.glob(os.path.join(BASE, "Reporte 3", "Nomina O.P Cruce*.xls"))
)

for path in files:
    print("\n" + "=" * 80)
    print(os.path.basename(path))
    print("=" * 80)
    wb = xlrd.open_workbook(path)
    ws = wb.sheet_by_name("BASE")

    current_name = None
    stats = {}

    for r in range(ws.nrows):
        name_raw = ws.cell_value(r, 1)
        if isinstance(name_raw, str):
            name = name_raw.strip()
            if name and name.lower() not in {"nombre del operador", ""}:
                current_name = name
                stats.setdefault(
                    current_name,
                    {
                        "days": 0,
                        "viajes_n": 0.0,
                        "pago_s": 0.0,
                        "diesel_v": 0.0,
                        "subtotal_w": 0.0,
                        "puntos_x": 0.0,
                        "pago_neto_y": 0.0,
                        "puntos_z": 0.0,
                    },
                )

        if not current_name:
            continue

        date = ws.cell_value(r, 2)
        if not isinstance(date, (int, float)) or date < 40000:
            continue

        row = stats[current_name]
        row["days"] += 1

        def val(c):
            v = ws.cell_value(r, c)
            return float(v) if isinstance(v, (int, float)) else 0.0

        row["viajes_n"] += val(13)
        row["pago_s"] += val(18)
        row["diesel_v"] += val(21)
        row["subtotal_w"] += val(22)
        row["puntos_x"] += val(23)
        row["pago_neto_y"] += val(24)
        row["puntos_z"] += val(25)

    for name, row in sorted(stats.items()):
        signal = row["viajes_n"] + row["pago_s"] + row["subtotal_w"] + row["pago_neto_y"] + row["puntos_z"]
        if signal <= 0:
            continue
        print(
            f"{name[:36]:36} | days={row['days']:1.0f} | N={row['viajes_n']:.2f} | S={row['pago_s']:.2f} | "
            f"W={row['subtotal_w']:.2f} | Y={row['pago_neto_y']:.2f} | Z={row['puntos_z']:.2f}"
        )
