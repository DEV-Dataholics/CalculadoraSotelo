import pandas as pd
import numpy as np
from datetime import datetime

# ==========================================
# CONFIGURATION & CONSTANTS
# ==========================================

# 1. Diesel Price (Per Liter)
DIESEL_PRICE_CHIHUAHUA = 14.85

# 2. Base Pay Rates (Chihuahua) — per km (confirmed from nomina formula col Q)
RATE_CHIHUAHUA_LOADED = 0.29333  # per km cargado
RATE_CHIHUAHUA_EMPTY  = 0.14666  # per km vacío / PT
# El Paso (ELP) origin trips: deduct US portion from paid km
ELP_KM_DEDUCTION = 40

# 2b. Base Pay Rates (Pacífico) — applies to legs through Pacific destinations
RATE_PACIFICO_LOADED = 0.30   # per km cargado
RATE_PACIFICO_EMPTY  = 0.15   # per km vacío / PT

# 3. Unit Yields (Rendimiento Base)
# Source: Seguimiento/Unidades rendimiento fCH - Hoja 1.csv (official table, 5 decimal precision required)
DEFAULT_YIELD = 2.37341
UNIT_YIELDS = {
    # Group 1: 2.37341 — F-002 al F-019, F-050, F-060, F-061, F-086-F-092, F-097-F-099, F-107, F-108, F-110
    'F-002': 2.37341, 'F-003': 2.37341, 'F-004': 2.37341, 'F-005': 2.37341,
    'F-006': 2.37341, 'F-007': 2.37341, 'F-008': 2.37341, 'F-009': 2.37341,
    'F-010': 2.37341, 'F-011': 2.37341, 'F-012': 2.37341, 'F-013': 2.37341,
    'F-014': 2.37341, 'F-015': 2.37341, 'F-016': 2.37341, 'F-017': 2.37341,
    'F-019': 2.37341, 'F-050': 2.37341, 'F-060': 2.37341, 'F-061': 2.37341,
    'F-086': 2.37341, 'F-087': 2.37341, 'F-088': 2.37341, 'F-089': 2.37341,
    'F-090': 2.37341, 'F-091': 2.37341, 'F-092': 2.37341, 'F-097': 2.37341,
    'F-098': 2.37341, 'F-099': 2.37341, 'F-107': 2.37341, 'F-108': 2.37341,
    'F-110': 2.37341,
    # Group 2: 2.45098 — F-021 al F-031, F-033, F-040, F-042
    'F-021': 2.45098, 'F-022': 2.45098, 'F-023': 2.45098, 'F-024': 2.45098,
    'F-025': 2.45098, 'F-026': 2.45098, 'F-027': 2.45098, 'F-028': 2.45098,
    'F-029': 2.45098, 'F-030': 2.45098, 'F-031': 2.45098, 'F-033': 2.45098,
    'F-040': 2.45098, 'F-042': 2.45098,
    # Group 3: 2.60127 — F-034, F-035, F-036
    'F-034': 2.60127, 'F-035': 2.60127, 'F-036': 2.60127,
    # Group 4: 2.11267 — F-045, F-051, F-059, F-069, F-074, F-082, F-100
    'F-045': 2.11267, 'F-051': 2.11267, 'F-059': 2.11267, 'F-069': 2.11267,
    'F-074': 2.11267, 'F-082': 2.11267, 'F-100': 2.11267,
    # Group 5: 2.701058 — F-111, F-112, F-121 (newer units, not yet in official CSV)
    'F-111': 2.701058, 'F-112': 2.701058, 'F-121': 2.701058,
}

# 4. Route Distances (Fallback)
ROUTE_DISTANCES = {
    ('JUAREZ', 'CHIHUAHUA'): 375,
    ('CHIHUAHUA', 'JUAREZ'): 375,
    ('EL PASO', 'CHIHUAHUA'): 415,
    ('CHIHUAHUA', 'EL PASO'): 415,
    ('PRECOS', 'CHIHUAHUA'): 360,
    ('CHIHUAHUA', 'PRECOS'): 360,
}

ROUTE_DISTANCES_PACIFICO = {
    ('JUAREZ', 'OBREGON'): 1021, ('OBREGON', 'JUAREZ'): 1021,
    ('JUAREZ', 'GUAMUCHIL'): 1330, ('GUAMUCHIL', 'JUAREZ'): 1330,
    ('OBREGON', 'GUAMUCHIL'): 328, ('GUAMUCHIL', 'OBREGON'): 328,
    ('CHIHUAHUA', 'OBREGON'): 1131, ('OBREGON', 'CHIHUAHUA'): 1131,
    ('MOCHIS', 'GUAMUCHIL'): 106, ('GUAMUCHIL', 'MOCHIS'): 106,
    ('JUAREZ', 'BACUM'): 1004, ('BACUM', 'JUAREZ'): 1004,
    ('MOCHIS', 'OBREGON'): 232, ('OBREGON', 'MOCHIS'): 232,
    ('BACUM', 'OBREGON'): 45, ('OBREGON', 'BACUM'): 45,
    ('CHIHUAHUA', 'MOCHIS'): 1363, ('MOCHIS', 'CHIHUAHUA'): 1363,
    ('JUAREZ', 'NAVOJOA'): 1081, ('NAVOJOA', 'JUAREZ'): 1081,
    ('CANANEA', 'OBREGON'): 551, ('OBREGON', 'CANANEA'): 551,
    ('JUAREZ', 'CANANEA'): 457, ('CANANEA', 'JUAREZ'): 457,
    ('JUAREZ', 'ETCHO'): 1118, ('ETCHO', 'JUAREZ'): 1118,
    ('ETCHO', 'OBREGON'): 97, ('OBREGON', 'ETCHO'): 97,
    ('OBREGON', 'NAVOJOA'): 67, ('NAVOJOA', 'OBREGON'): 67,
    ('ETCHO', 'NAVOJOA'): 30, ('NAVOJOA', 'ETCHO'): 30,
    ('OBREGON', 'CUAHU'): 1236, ('CUAHU', 'OBREGON'): 1236,
    ('ETCHO', 'JANOS'): 888, ('JANOS', 'ETCHO'): 888,
    ('JANOS', 'OBREGON'): 795, ('OBREGON', 'JANOS'): 795,
    ('NOGALES', 'JUAREZ'): 603, ('JUAREZ', 'NOGALES'): 603,
    ('S. RIO COL.', 'HERMOSILLO'): 630,
    ('HERMOSILLO', 'OBREGON'): 255,
    ('CHIHUAHUA', 'CUAHU'): 145, ('CUAHU', 'CHIHUAHUA'): 145,
    ('S. RIO COL.', 'EMPALME'): 772,
    ('EMPALME', 'OBREGON'): 120,
    ('JANOS', 'GUAMUCHIL'): 1120, ('GUAMUCHIL', 'JANOS'): 1120,
    ('JUAREZ', 'JANOS'): 219, ('JANOS', 'JUAREZ'): 219,
    ('JANOS', 'MOCHIS'): 1027,
    ('JUAREZ', 'CUAHU'): 480, ('CUAHU', 'JUAREZ'): 480,
    ('S. RIO COL.', 'JUAREZ'): 1037, ('JUAREZ', 'S. RIO COL.'): 1037,
    ('CHIHUAHUA', 'JANOS'): 348, ('JANOS', 'CHIHUAHUA'): 348,
    ('S. RIO COL.', 'OBREGON'): 885,
    ('JUAREZ', 'MOCHIS'): 1254, ('MOCHIS', 'JUAREZ'): 1224,
    ('JUAREZ', 'HERMOSILLO'): 800
}

# 5. Bono Químico (Foráneo Chihuahua — Hallazgo #2)
BONO_QUIMICO = 250.00

# 6. Client-Named Route Table
# Source: Seguimiento/rutas (1).xlsx - rutas.csv (official km per origin-dest client pair)
# Keys must be UPPERCASE to match normalization in get_route_kms
ROUTE_DISTANCES_CLIENTS = {
    ('GYSA ASCENCION', 'FLETES SOTELO'): 200,
    ('APTIV GUAMUCHIL FV52', 'APTIV / RIO BRAVO 7 FV32'): 1330,
    ('APTIV GUAMUCHIL FV52', 'FLETES SOTELO'): 1330,
    ('ATLAS AEROSPACE', 'FLETES SOTELO'): 375,
    ('ATLAS AEROSPACE', 'PRECOS ZARAGOZA'): 375,
    ('BASE SOTELO CHIHUAHUA', 'CASETA DE VILLA AHUMADA'): 130,
    ('BASE SOTELO CHIHUAHUA', 'FLETES SOTELO'): 375,
    ('BASE SOTELO CHIHUAHUA', 'PRECOS ZARAGOZA'): 375,
    ('BASE SOTELO CHIHUAHUA', 'YARDA DEL SIETE'): 375,
    ('BASE SOTELO CHIHUAHUA', 'APTIV MOCHIS FV59'): 1363,
    ('BASE SOTELO CHIHUAHUA', 'APTIV RIO BRAVO 4 FV33'): 375,
    ('BASE SOTELO CHIHUAHUA', 'GYSA JUAREZ JDC'): 375,
    ('BASE SOTELO CHIHUAHUA', 'GYSA OBREGON PDC'): 1131,
    ('DTR', 'PRECOS ZARAGOZA'): 375,
    ('DTR', 'FLETES SOTELO'): 375,
    ('GYSA OBREGON 2', 'FLETES SOTELO'): 1021,
    ('GYSA OBREGON 2', 'GYSA ETCHOJOA'): 97,
    ('IMPULSORA GANE', 'FLETES SOTELO'): 375,
    ('NORDAM', 'FLETES SOTELO'): 375,
    ('NORDAM', 'PRECOS ZARAGOZA'): 375,
    ('PACTIV DE MEXICO S. DE R.L DE C.V.', 'FLETES SOTELO'): 375,
    ('SAFRAN PLANTA 3/OSM/OXYGEN SYSTEMS', 'FLETES SOTELO'): 375,
    ('SAFRAN PLANTA 3 /WWM/ WATER & WASTE MEX (MONOGRAM)', 'FLETES SOTELO'): 375,
    ('SAFRAN PLANTA 1 /EMX/ EVACUATION SY (AIR CRUSIERS)', 'FLETES SOTELO'): 375,
    ('SMTC PLANTA 1', 'FLETES SOTELO'): 375,
    ('THUASNE MX', 'FLETES SOTELO'): 375,
    ('XOMOX CHIHUAHUA S.A DE C.V.', 'FLETES SOTELO'): 375,
    ('YARDA SOTELO OBREGON', 'FLETES SOTELO'): 1021,
    ('YARDA SOTELO OBREGON', 'PRECOS ZARAGOZA'): 1021,
    ('YARDA SOTELO OBREGON', 'GYSA BACUM'): 45,
    ('YARDA SOTELO OBREGON', 'GYSA ETCHOJOA'): 97,
    ('YARDA SOTELO OBREGON', 'GYSA  CDJ'): 1021,
    ('YAZAKI COMPONENTES PLANTA 3', 'FLETES SOTELO'): 375,
    ('YAZAKI COMPONENTES PLANTA 3', 'GYSA JUAREZ JDC'): 1131,
    ('YAZAKI COMPONENTES PLANTA 3', 'GYSA OBREGON PDC'): 1131,
    ('APTIV MOCHIS FV59', 'YARDA SOTELO OBREGON'): 232,
    ('APTIV MOCHIS FV59', 'APTIV GUAMUCHIL FV52'): 106,
    ('APTIV / RIO BRAVO 7 FV32', 'APTIV GUAMUCHIL FV52'): 1330,
    ('DEMINSA SA DE CV', 'YARDA SOTELO OBREGON'): 255,
    ('FLETES SOTELO', 'APTIV GUAMUCHIL FV52'): 1330,
    ('FLETES SOTELO', 'APTIV MOCHIS FV59'): 1224,
    ('FLETES SOTELO', 'BASE SOTELO CHIHUAHUA'): 375,
    ('FLETES SOTELO', 'IMPULSORA GANE'): 375,
    ('FLETES SOTELO', 'YARDA SOTELO OBREGON'): 1021,
    ('FLETES SOTELO', 'YAZAKI COMPONENTES PLANTA 3'): 375,
    ('FLETES SOTELO', 'GYSA ASCENCION'): 200,
    ('FLETES SOTELO', 'GYSA BACUM'): 1004,
    ('FLETES SOTELO', 'GYSA ETCHOJOA'): 1118,
    ('FLETES SOTELO', 'GYSA OBREGON 1'): 1021,
    ('FLETES SOTELO', 'GYSA OBREGON 2'): 1021,
    ('FLETES SOTELO', 'GYSA OBREGON PDC'): 1021,
    ('FLETES SOTELO', 'HUNGAROS / NOGALES'): 600,
    ('FLETES SOTELO', 'ARNPRIOR AEROSPACE CHIHUAHUA'): 375,
    ('FLETES SOTELO', 'CESSNA PLANTA 4.1'): 375,
    ('GYSA  CDJ', 'FLETES SOTELO'): 375,
    ('GYSA  CDJ', 'YARDA SOTELO OBREGON'): 1021,
    ('GYSA BACUM', 'GYSA NAVOJOA'): 112,
    ('GYSA BACUM', 'GYSA OBREGON (CDO2)'): 45,
    ('GYSA BACUM', 'GYSA OBREGON 2'): 45,
    ('GYSA BACUM', 'GYSA OBREGON ODC'): 45,
    ('GYSA BACUM', 'GYSA OBREGON PDC'): 45,
    ('GYSA BACUM', 'YARDA SOTELO OBREGON'): 45,
    ('GYSA ETCHOJOA', 'FLETES SOTELO'): 1118,
    ('GYSA ETCHOJOA', 'GYSA  CDJ'): 1118,
    ('GYSA ETCHOJOA', 'GYSA OBREGON ODC'): 97,
    ('GYSA ETCHOJOA', 'GYSA OBREGON PDC'): 97,
    ('GYSA JUAREZ JDC', 'GYSA OBREGON 2'): 1021,
    ('GYSA NAVOJOA', 'GYSA OBREGON ODC'): 67,
    ('GYSA NAVOJOA', 'GYSA OBREGON PDC'): 67,
    ('GYSA NAVOJOA', 'YARDA SOTELO OBREGON'): 67,
    ('GYSA OBREGON ODC', 'GYSA BACUM'): 45,
    ('GYSA OBREGON ODC', 'GYSA ETCHOJOA'): 97,
    ('GYSA OBREGON ODC', 'GYSA NAVOJOA'): 67,
    ('GYSA OBREGON PDC', 'GYSA BACUM'): 45,
    ('GYSA OBREGON PDC', 'GYSA ETCHOJOA'): 97,
    ('GYSA OBREGON PDC', 'GYSA NAVOJOA'): 67,
    ('COFICAB LEON, S. DE R.L. DE C.V. / PLANTA JUAREZ', 'TE CONNECTIVITY HERMOSILLO'): 800,
    ('COFICAB LEON, S. DE R.L. DE C.V. / PLANTA JUAREZ', 'GYSA OBREGON PDC'): 1021,
    ('TRANSERVICIOS CHIHUAHUA', 'TRANSERVICIOS CD JUAREZ'): 375,
}

PACIFICO_KEYWORDS = ['OBRG', 'OBREGON', 'MOCHIS', 'GUAMUCHIL', 'NAVOJOA', 'CANANEA', 'ETCHO', 'JANOS', 'NOGALES', 'S. RIO COL', 'HERMOSILLO', 'EMPALME', 'BACUM', 'GYSA', 'YARDA SOTELO']

def is_pacifico_loc(loc):
    loc_up = str(loc).upper()
    return any(k in loc_up for k in PACIFICO_KEYWORDS)


def get_route_kms(origin, dest, row_kms=0):
    """
    Returns Kms from table or row, applying specific cleanup.
    Priority: 1) Exact client-named route, 2) Normalized city route, 3) Row kms.
    """
    org_up = str(origin).upper().strip()
    dest_up = str(dest).upper().strip()

    # 1. Check exact client-named route table (highest fidelity)
    if (org_up, dest_up) in ROUTE_DISTANCES_CLIENTS:
        return ROUTE_DISTANCES_CLIENTS[(org_up, dest_up)]

    # 2. Normalize to city-level and check standard tables
    org_norm = 'JUAREZ' if 'JRZ' in org_up or 'JUAREZ' in org_up or 'BASE' in org_up else org_up
    org_norm = 'EL PASO' if 'EL PASO' in org_up or 'ELP' in org_up or 'RIO BRAVO' in org_up else org_norm
    org_norm = 'CHIHUAHUA' if 'CHIH' in org_up else org_norm

    dest_norm = 'JUAREZ' if 'JRZ' in dest_up or 'JUAREZ' in dest_up or 'BASE' in dest_up else dest_up
    dest_norm = 'EL PASO' if 'EL PASO' in dest_up or 'RIO BRAVO' in dest_up else dest_norm
    dest_norm = 'CHIHUAHUA' if 'CHIH' in dest_up else dest_norm

    if (org_norm, dest_norm) in ROUTE_DISTANCES:
        return ROUTE_DISTANCES[(org_norm, dest_norm)]

    # 3. Check Pacifico city table
    pac_org = 'OBREGON' if 'OBR' in org_norm else org_norm
    pac_dest = 'OBREGON' if 'OBR' in dest_norm else dest_norm

    if (pac_org, pac_dest) in ROUTE_DISTANCES_PACIFICO:
        return ROUTE_DISTANCES_PACIFICO[(pac_org, pac_dest)]

    # 4. Fall back to row kms from Genesis
    try:
        val = float(row_kms)
        if not pd.isna(val) and val > 0:
            return val
    except:
        pass
    return 0
    
def get_payroll_week(date_obj):
    """
    Returns the Custom Payroll Week number.
    Logic: ISO Week + 1 (Monday-Sunday cycle).
    Example: Sep 29, 2025 (ISO Wk 40) -> Payroll Wk 41
    """
    if pd.isna(date_obj):
        return 0
    
    try:
        # isocalendar returns (year, week, day)
        iso_year, iso_week, iso_day = date_obj.isocalendar()
        
        # Adjustment for late 2025 based on analysis
        return iso_week + 1
    except:
        return 0

def bundle_movements(driver_df):
    """
    Bundles movements into 'Trips' based on return to Hub.
    """
    trips = []
    current_trip = []
    
    if driver_df.empty:
        return []
        
    driver_df = driver_df.sort_values('Arranque')
    

    # DEBUGGING: Trace Trip Bundling
    # print(f"DEBUG: Processing driver with {len(driver_df)} rows")
    
    for idx, row in driver_df.iterrows():
        current_trip.append(row)
        
        dest = str(row.get('Destino', '')).upper()
        # Keywords indicating a return to base/hub
        is_hub_return = 'JUAREZ' in dest or 'JRZ' in dest or 'BASE SOTELO' in dest or 'EL PASO' in dest or 'PRECOS' in dest
        
        # DEBUG: Print specific row details to see what's failing match
        # print(f"DEBUG: Row Dest='{dest}' -> is_hub_return={is_hub_return}")

        if is_hub_return:
            trips.append(pd.DataFrame(current_trip))
            current_trip = []
            
    if current_trip:
        # print("DEBUG: Appending final partial trip")
        trips.append(pd.DataFrame(current_trip))
        
    # print(f"DEBUG: Found {len(trips)} trips for driver")
    return trips

def calculate_chihuahua_payroll(trips, driver_name):
    """
    Calculates payroll for a list of trip DataFrames.
    Returns a list of dictionaries.
    """
    payroll_entries = []
    
    for i, trip_df in enumerate(trips):
        if trip_df.empty: continue
        
        start_date = trip_df['Arranque'].min()
        end_date = trip_df['Arribo destino'].max()
        unit = trip_df.iloc[0]['Tractor']
        
        base_pay = 0
        total_kms = 0
        leg_details = []
        legs_data = []
        
        for _, row in trip_df.iterrows():
            origin = str(row.get('Origen', '')).upper()
            dest = str(row.get('Destino', '')).upper()
            status = str(row.get('Estatus flete', '')).upper()
            tipo = str(row.get('Tipo', '')).upper()
            coments = str(row.get('Comentarios', '')).upper()
            
            is_loaded = (status == 'FACTURADO') or (tipo in ['IMP-02', 'EXP-02', 'FOR-02', 'MDC-01', 'TRI-02', 'TRE-02'])
            if 'VACIO' in coments or 'VASIO' in coments or status == 'COMPLETO' or tipo == 'PTT-00':
                is_loaded = False
            
            raw_kms = get_route_kms(origin, dest, row.get('Kms', 0))
            # ELP origin: deduct US portion (not paid)
            if 'ELP' in origin or 'EL PASO' in origin:
                raw_kms = max(0, raw_kms - ELP_KM_DEDUCTION)
            total_kms += raw_kms

            # Routes through Pacific destinations use PAC rate ($0.30/$0.15)
            # regardless of nomina type (confirmed from nomina formula analysis)
            if is_pacifico_loc(origin) or is_pacifico_loc(dest):
                rate = RATE_PACIFICO_LOADED if is_loaded else RATE_PACIFICO_EMPTY
            else:
                rate = RATE_CHIHUAHUA_LOADED if is_loaded else RATE_CHIHUAHUA_EMPTY
            leg_pay = raw_kms * rate
            base_pay += leg_pay
            leg_details.append(f"{origin}->{dest} ({raw_kms}km x {rate}="+f"${leg_pay:.2f})")
            legs_data.append({
                'Origin': origin,
                'Destination': dest,
                'Type': tipo,
                'Status': status,
                'Kms': float(raw_kms),
                'Is_Loaded': is_loaded
            })

        # NOTE: Diesel calculation is manual-only (MVP canon).
        # Diesel data (liters, price, efficiency factor) are entered by the payroll operator.
        entry = {
            'id': f"{driver_name}_{i}_{int(start_date.timestamp())}",
            'Trip_ID': f"Trip_{i+1}",
            'Driver': driver_name,
            'Unit': unit,
            'Start_Date': start_date.strftime('%Y-%m-%d %H:%M'),
            'End_Date': end_date.strftime('%Y-%m-%d %H:%M') if not pd.isna(end_date) else "In Progress",
            'Route': " | ".join(leg_details),
            'Total_Kms_Raw': float(total_kms),
            'Base_Pay': float(base_pay),
            'Manual_Diesel_Pay': 0.0,
            'Payroll_Week': get_payroll_week(start_date),
            'Status': 'PENDING',
            'Legs': legs_data
        }
        payroll_entries.append(entry)

    return payroll_entries

def calculate_pacifico_payroll(trips, driver_name):
    """
    Calculates base payroll for Foraneo Pacifico routes.
    Base pay = sum of (km_per_leg × rate) where rate = $0.30 loaded / $0.15 empty or PT.
    NOTE: Diesel calculation is manual-only (MVP canon). Bonos are also entered manually.
    """
    payroll_entries = []
    
    for i, trip_df in enumerate(trips):
        if trip_df.empty: continue
        
        start_date = trip_df['Arranque'].min()
        end_date = trip_df['Arribo destino'].max()
        unit = trip_df.iloc[0]['Tractor']
        
        base_pay = 0.0
        total_kms = 0.0
        leg_details = []
        legs_data = []
        
        for _, row in trip_df.iterrows():
            origin = str(row.get('Origen', '')).upper()
            dest = str(row.get('Destino', '')).upper()
            tipo = str(row.get('Tipo', '')).upper()
            status = str(row.get('Estatus flete', '')).upper()
            coments = str(row.get('Comentarios', '')).upper()
            
            # Same loaded/empty classification logic as FCH
            is_loaded = (status == 'FACTURADO') or (tipo in ['IMP-02', 'EXP-02', 'FOR-02', 'MDC-01', 'TRI-02', 'TRE-02'])
            if 'VACIO' in coments or 'VASIO' in coments or status == 'COMPLETO' or tipo == 'PTT-00':
                is_loaded = False
            
            rate = 0.30 if is_loaded else 0.15
            raw_kms = get_route_kms(origin, dest, row.get('Kms', 0))
            leg_pay = raw_kms * rate
            base_pay += leg_pay
            total_kms += raw_kms
            
            leg_details.append(f"{origin}->{dest} ({raw_kms}km × ${rate}=${leg_pay:.2f})")
            legs_data.append({
                'Origin': origin,
                'Destination': dest,
                'Type': tipo,
                'Status': status,
                'Kms': float(raw_kms),
                'Is_Loaded': is_loaded,
                'Rate': float(rate),
                'Leg_Pay': float(leg_pay)
            })

        entry = {
            'id': f"{driver_name}_{i}_{int(start_date.timestamp())}",
            'Trip_ID': f"Trip_{i+1}",
            'Driver': driver_name,
            'Unit': unit,
            'Start_Date': start_date.strftime('%Y-%m-%d %H:%M'),
            'End_Date': end_date.strftime('%Y-%m-%d %H:%M') if not pd.isna(end_date) else "In Progress",
            'Route': " | ".join(leg_details),
            'Total_Kms_Raw': float(total_kms),
            'Base_Pay': round(float(base_pay), 2),
            'Manual_Diesel_Pay': 0.0,
            'Payroll_Week': get_payroll_week(start_date),
            'Status': 'PENDING',
            'Is_Pacifico': True,
            'Manual_Pac_Bono_Sierra': False,
            'Manual_Pac_Bono_Doble': False,
            'Manual_Pac_Estancia_Obregon': 0,
            'Manual_Pac_Estancia_Mochis': 0,
            'Legs': legs_data
        }
        payroll_entries.append(entry)

    return payroll_entries
