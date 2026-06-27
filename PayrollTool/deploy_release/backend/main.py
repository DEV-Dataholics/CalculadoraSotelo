from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import io
from logic.payroll import bundle_movements, calculate_chihuahua_payroll, calculate_pacifico_payroll, is_pacifico_loc

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Trip(BaseModel):
    id: str
    Trip_ID: str
    Driver: str
    Unit: str
    Start_Date: str
    End_Date: str
    Route: str
    Allowed_Liters: float
    Base_Pay: float
    Diesel_Rate: float
    Total_Kms_Raw: float = 0.0
    Total_Kms_Paid: float = 0.0
    Yield_Used: float = 0.0
    Manual_Refuel_Liters: float = 0.0
    Payroll_Week: int
    Status: str = "PENDING"
    Is_Pacifico: bool = False
    Manual_Pac_Loaded: bool = True
    Manual_Pac_Bono_Sierra: bool = False
    Manual_Pac_Bono_Doble: bool = False
    Manual_Pac_Estancia_Obregon: int = 0
    Manual_Pac_Estancia_Mochis: int = 0
    Legs: List[Dict[str, Any]] = []
    
class CalculationRequest(BaseModel):
    trips: List[Trip]

@app.post("/api/upload")
async def upload_genesis(file: UploadFile = File(...)):
    # print(f"DEBUG: Received file upload: {file.filename}, Content-Type: {file.content_type}")
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        # print(f"DEBUG: Rejected file {file.filename} due to extension")
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload Excel or CSV.")
        
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            # Try reading with common encodings
            try:
                df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(contents), encoding='latin1')
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Preprocessing
        date_cols = [c for c in df.columns if 'FECHA' in str(c).upper() or 'ARRANQUE' in str(c).upper() or 'ARRIBO' in str(c).upper()]
        for c in date_cols:
            df[c] = pd.to_datetime(df[c], errors='coerce')
            
        # Filter mechanism removed to allow flexibility for now.
        # Ideally, we should detect the week from the file or let the user select it.
        # For now, we process all data in the file.
        pass
        
        # print(f"DEBUG: DataFrame loaded. Shape: {df.shape}")
        # print(f"DEBUG: Columns: {df.columns.tolist()}")

        results = []
        grouped = df.groupby('Conductor')
        # print(f"DEBUG: Found {len(grouped)} unique drivers")

        for driver, group in grouped:
            trips = bundle_movements(group)
            
            # Determinar si el chofer opera en pacifico
            is_pac = False
            for t in trips:
                if not t.empty:
                    # Validar en TODOS los renglones (legs) del viaje, no solo en t.iloc[0]
                    for _, row in t.iterrows():
                        if is_pacifico_loc(row.get('Origen', '')) or is_pacifico_loc(row.get('Destino', '')):
                            is_pac = True
                            break
                if is_pac: # Si ya se encontró que es pacífico en algún leg, salir
                    break
                        
            if is_pac:
                driver_results = calculate_pacifico_payroll(trips, driver)
            else:
                driver_results = calculate_chihuahua_payroll(trips, driver)
                
            results.extend(driver_results)
            
        # print(f"DEBUG: Total trips generated: {len(results)}")
        return {"trips": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calculate")
async def recalculate(req: CalculationRequest):
    """
    Recalculates totals based on Manual Refuel Input.
    """
    updated_trips = []
    
    for trip in req.trips:
        trip_dict = trip.dict()
        
        if trip.Is_Pacifico:
            rate = 0.30 if trip.Manual_Pac_Loaded else 0.15
            base_pay = trip.Total_Kms_Paid * rate
            
            bonuses = 0
            if trip.Manual_Pac_Bono_Sierra: bonuses += 500
            if trip.Manual_Pac_Bono_Doble: bonuses += 1726
            bonuses += (trip.Manual_Pac_Estancia_Obregon * 600)
            bonuses += (trip.Manual_Pac_Estancia_Mochis * 300)
            
            savings = max(0, trip.Allowed_Liters - trip.Manual_Refuel_Liters)
            incentive = savings * trip.Diesel_Rate
            
            total_pay = base_pay + bonuses + incentive
            
            trip_dict['Base_Pay'] = base_pay
            if trip_dict['Status'] == 'NEEDS_INPUT':
                trip_dict['Status'] = 'PENDING'
        else:
            savings = max(0, trip.Allowed_Liters - trip.Manual_Refuel_Liters)
            incentive = savings * trip.Diesel_Rate
            total_pay = trip.Base_Pay + incentive
            
        trip_dict['Diesel_Savings'] = savings
        trip_dict['Incentive_Pay'] = incentive
        trip_dict['Total_Pay'] = total_pay
        updated_trips.append(trip_dict)
        
    return {"trips": updated_trips}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
