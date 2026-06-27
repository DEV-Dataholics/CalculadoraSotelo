import requests
import os
import pandas as pd
import json

# Configuration
API_URL = "http://localhost:8000/api/upload"
FILE_PATH = r'c:/Users/luisc/OneDrive/Documents/Dataholics/Calculadoras Sotelo/Genesis/Movimientos octubre 2025.xlsx'

def test_api():
    print(f"Testing API at: {API_URL}")
    print(f"Uploading: {FILE_PATH}")
    
    if not os.path.exists(FILE_PATH):
        print("Error: File not found.")
        return

    try:
        with open(FILE_PATH, 'rb') as f:
            files = {'file': ('Movimientos octubre 2025.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post(API_URL, files=files)
            
        if response.status_code == 200:
            data = response.json()
            trips = data.get('trips', [])
            print(f"Success! Received {len(trips)} total trips.")
            
            # Verification 1: Check AGUILAR (Should exist)
            aguilar_trips = [t for t in trips if "AGUILAR ESQUIVEL" in t['Driver']]
            print(f"AGUILAR Trips: {len(aguilar_trips)} (Expected > 0)")
            
            # Verification 2: Check RODRIGUEZ VALLES (Should exclude Sunday trip to Guamuchil)
            rodriguez_trips = [t for t in trips if "RODRIGUEZ VALLES" in t['Driver']]
            print(f"RODRIGUEZ VALLES Trips: {len(rodriguez_trips)}")
            
            sunday_trip_found = False
            for t in rodriguez_trips:
                print(f"  - Route: {t['Route']} ({t['Start_Date']})")
                if "GUAMUCHIL" in t['Route'] or "APTIV" in t['Route']:
                    sunday_trip_found = True
            
            if len(aguilar_trips) > 0 and not sunday_trip_found:
                print("\n✅ PASS: Sunday Trip excluded. Temporal Logic Verification Successful.")
            else:
                print("\n❌ FAIL: Sunday Trip detected.")
                
        else:
            print(f"Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_api()
