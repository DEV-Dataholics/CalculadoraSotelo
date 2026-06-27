import requests
import pandas as pd
import io

# Dummy Data
data = {
    "Conductor": ["TEST DRIVER", "TEST DRIVER", "TEST DRIVER"],
    "Arranque": ["2025-10-21 08:00:00", "2025-10-21 12:00:00", "2025-10-21 18:00:00"],
    "Arribo destino": ["2025-10-21 10:00:00", "2025-10-21 14:00:00", "2025-10-21 20:00:00"],
    "Origen": ["JUAREZ", "CHIHUAHUA", "JUAREZ"],
    "Destino": ["CHIHUAHUA", "JUAREZ", "CHIHUAHUA"],
    "Tractor": ["F-002", "F-002", "F-002"],
    "Estatus flete": ["COMPLETO", "COMPLETO", "COMPLETO"],
    "Tipo": ["VIAJE", "VIAJE", "VIAJE"],
    "Comentarios": ["", "", ""],
    "Kms": [375, 375, 375]
}

df = pd.DataFrame(data)
csv_buffer = io.StringIO()
df.to_csv(csv_buffer, index=False)
csv_content = csv_buffer.getvalue().encode('utf-8')

print("Generated dummy CSV content:")
print(csv_content.decode('utf-8'))

# Upload
url = "http://localhost:8000/api/upload"
files = {'file': ('test.csv', csv_content, 'text/csv')}

try:
    print(f"\nSending POST request to {url}...")
    response = requests.post(url, files=files)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        json_resp = response.json()
        trips = json_resp.get("trips", [])
        print(f"\nSUCCESS: Received {len(trips)} trips.")
        if len(trips) > 0:
            t = trips[0]
            week_val = t.get('Payroll_Week')
            print(f"First trip sample: Week={week_val} | Driver={t.get('Driver')}")
            
            if week_val != 44:
                print(f"FAILURE: Expected Week 44, got {week_val}")
                exit(1)
        else:
            print("WARNING: Response 200 but 0 trips found.")
            exit(1)
    else:
        print("FAILURE: Request failed.")
        
except Exception as e:
    print(f"ERROR: {e}")
