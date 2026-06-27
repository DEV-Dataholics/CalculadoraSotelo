
import pandas as pd
import requests

API_URL = "http://localhost:8000/api/calculate"
CONTROL_FILE = r"C:\Users\luisc\OneDrive\Documents\Dataholics\Calculadoras Sotelo\Reportes\Reporte 1\Foraneo Chihuahua Semana #44.xlsx"
SOURCE_FILE = r"C:\Users\luisc\OneDrive\Documents\Dataholics\Calculadoras Sotelo\Genesis\Movimientos octubre 2025.xlsx"

def run_validation():
    print("1. Loading Control File...")
    control_df = pd.read_excel(CONTROL_FILE)
    # Expected columns based on previous knowledge: 'Conductor', 'Total a Pagar'
    # Let's normalize column names if needed
    
    print("2. Calling API with Source File...")
    with open(SOURCE_FILE, 'rb') as f:
        files = {'file': (SOURCE_FILE, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        response = requests.post(API_URL, files=files)
    
    if response.status_code != 200:
        print(f"API Error: {response.text}")
        return

    api_data = response.json()
    trips = api_data.get('trips', [])
    
    # Filter for Week 44
    week_44_trips = [t for t in trips if t.get('Payroll_Week') == 44]
    
    # Aggregating API results by Driver
    api_totals = {}
    for t in week_44_trips:
        driver = t['Driver']
        total = t['Calculated_Total']
        api_totals[driver] = api_totals.get(driver, 0) + total
        
    print(f"API Drivers Found: {len(api_totals)}")

    # Aggregating Control File results
    # Inspect columns first to be sure
    print("Control File Columns:", control_df.columns.tolist())
    
    # Assuming standard columns, let's try to map them
    # We need to identify the Driver and Amount columns in the control file
    # Based on standard reports, it might be 'CONDUCTOR' and 'TOTAL'
    # Let's do a fuzzy match or print head to decide
    
    print("Control data sample:", control_df.head(1).to_dict())

    # Create Comparison
    print("\n--- DISCREPANCY REPORT ---")
    print(f"{'DRIVER':<40} | {'CONTROL':<12} | {'SYSTEM':<12} | {'DIFF':<12}")
    print("-" * 85)
    
    total_diff = 0
    
    # Join on driver name (might need normalization)
    # For now, let's list API totals to see if they match anything in the control file manual inspection
    for driver, api_amt in api_totals.items():
        print(f"{driver:<40} | {'N/A':<12} | {api_amt:<12.2f} | {0.00:<12}")

if __name__ == "__main__":
    run_validation()
