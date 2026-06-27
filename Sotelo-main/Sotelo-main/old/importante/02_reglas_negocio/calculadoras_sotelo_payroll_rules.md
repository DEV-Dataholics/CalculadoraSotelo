# Calculadoras Sotelo — Payroll Rules (Validated)

## Tasas Confirmadas (vs nóminas pagadas semanas 41-45)

### FCH (Foráneo Chihuahua)
- Cargado: `km × 0.29333` (≈ $110 para 375km estándar)
- Vacío/PT: `km × 0.14666` (≈ $55 para 375km)
- ELP (El Paso) origin: deducir 40km de la ruta (porción USA no pagada)
- **Excepción**: Legs que pasan por destinos Pacífico (OBRG, GUAMUCHIL, etc.) usan tasa PAC ($0.30/$0.15)

### PAC (Foráneo Pacífico)
- Cargado: `km × 0.30`
- Vacío/PT: `km × 0.15`
- Template corto (10 filas): PAGO POR KM en F33; largo (15 filas): en F38

### Detección de ruta Pacífico
Keywords: OBRG, OBREGON, MOCHIS, GUAMUCHIL, NAVOJOA, CANANEA, ETCHO, JANOS, NOGALES, HERMOSILLO, EMPALME, BACUM, GYSA, YARDA SOTELO

### Códigos C/V/PT (col N nómina)
- 1=Cargado, 2=Vacío, 3=PT
- 4=ELP (-40km), 5=FOK/HAW (-50km), 6=FOK/HAW+ELP (-90km)

## Diesel — Canon MVP
- 100% manual: precio, litros recargados, factor rendimiento entrados por operador de nómina
- No hay cálculo automático de diesel

## Bonos PAC
- Sierra: $500 fijo
- Doble Operador (Aptiv Guamúchil): $2,439
- Estancia Obregón: × $600
- Mochis: × $300

## Validación Final (semanas 41-45)
- FCH: 128/129 = 99.2% exacto (dentro de $1)
- PAC: 57/63 = 90.5% exacto
- Total: 185/193 = 95.9%

## Archivos Clave
- `PayrollTool/backend/logic/payroll.py` — motor de cálculo (corregido)
- `PayrollTool/backend/main.py` — FastAPI backend
- `tmp_validate_base_pay.py` — script de validación vs nóminas reales
- `Reportes/Reporte 1/` — nóminas FCH y PAC semanas 41-45
