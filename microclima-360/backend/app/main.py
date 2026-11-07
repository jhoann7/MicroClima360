"""MicroClima 360 API — synthetic demonstration data, not field observations."""
from datetime import datetime, timedelta
from io import StringIO
import csv
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MicroClima 360 API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

AREAS = ["pasto", "secundaria", "primaria"]
TRANSFORM = np.array([[1, 1], [-1, 0], [0, -1]], dtype=float)

@lru_cache(maxsize=1)
def demo_data():
    """24 hours, one reading every 30 minutes. Deterministic simulated data."""
    start = datetime(2026, 7, 23)
    timestamps = [(start + timedelta(minutes=30 * i)).isoformat() for i in range(48)]
    hours = np.arange(48) / 2
    daytime = np.maximum(0, np.sin(np.pi * (hours - 6) / 12))
    temp = np.column_stack([
        24 + 10 * daytime,
        23.5 + 6.7 * daytime,
        23 + 4.5 * daytime,
    ]).round(2)
    humidity = np.column_stack([
        88 - 36 * daytime,
        91 - 23 * daytime,
        94 - 17 * daytime,
    ]).round(2)
    differences = temp @ TRANSFORM
    records = [
        {
            "timestamp": timestamps[i],
            "temperature": dict(zip(AREAS, map(float, temp[i]))),
            "humidity": dict(zip(AREAS, map(float, humidity[i]))),
            "differences": {
                "pasto_menos_secundaria": round(float(differences[i, 0]), 2),
                "pasto_menos_primaria": round(float(differences[i, 1]), 2),
            },
        }
        for i in range(len(timestamps))
    ]
    return records

def load_bundled_data():
    """Validated, time-aligned field data shipped with the project."""
    path = Path(__file__).resolve().parents[2] / 'dados-reais' / 'microclima_360_dados_reais_alinhados.csv'
    if not path.is_file():
        return None
    result = []
    with path.open(encoding='utf-8-sig', newline='') as handle:
        for row in csv.DictReader(handle):
            temps = [float(row[f'temp_{area}']) for area in AREAS]
            hums = [float(row[f'rh_{area}']) for area in AREAS]
            dif = np.array(temps) @ TRANSFORM
            result.append({
                'timestamp': row['timestamp'],
                'temperature': dict(zip(AREAS, temps)),
                'humidity': dict(zip(AREAS, hums)),
                'differences': {'pasto_menos_secundaria': round(float(dif[0]),4), 'pasto_menos_primaria': round(float(dif[1]),4)},
            })
    return result

bundled_records = load_bundled_data()
uploaded_records = None

@app.get("/api/health")
def health():
    return {"status": "ok", "source": "field_data" if bundled_records is not None else "synthetic_demo"}

@app.get("/api/measurements")
def measurements():
    return {
        "source": "uploaded_csv" if uploaded_records is not None else "field_data" if bundled_records is not None else "synthetic_demo",
        "notice": "Dados importados de CSV pelo usuário; confira a procedência e o controle de qualidade." if uploaded_records is not None else "Registros reais alinhados de HOBO (pasto, secundária e primária)." if bundled_records is not None else "Dados simulados para demonstração; não são medições reais.",
        "areas": AREAS,
        "matrix": TRANSFORM.astype(int).tolist(),
        "records": uploaded_records if uploaded_records is not None else bundled_records if bundled_records is not None else demo_data(),
    }

from pydantic import BaseModel, Field

class LabRequest(BaseModel):
    pasto: float = Field(ge=-50, le=80)
    secundaria: float = Field(ge=-50, le=80)
    primaria: float = Field(ge=-50, le=80)

@app.post('/api/lab/calculate')
def calculate_lab(values: LabRequest):
    """Compute one row-vector transformation, including pedagogical intermediate terms."""
    v = np.array([values.pasto, values.secundaria, values.primaria], dtype=float)
    output = v @ TRANSFORM
    terms = (v[:, None] * TRANSFORM).tolist()
    return {
        'vector': v.tolist(), 'matrix': TRANSFORM.astype(int).tolist(),
        'terms': terms, 'result': np.round(output, 4).tolist(),
        'explanations': ['Pasto − floresta secundária', 'Pasto − floresta primária'],
        'source': 'user_input',
    }


CSV_COLUMNS = [
    "timestamp", "temp_pasto", "temp_secundaria", "temp_primaria",
    "rh_pasto", "rh_secundaria", "rh_primaria",
]

@app.post("/api/data/import")
async def import_csv(file: UploadFile = File(...)):
    """Import synchronized HOBO exports after preprocessing; store only in memory."""
    global uploaded_records
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(400, "Envie um arquivo .csv com o formato do modelo.")
    raw = await file.read(3_000_001)
    if len(raw) > 3_000_000:
        raise HTTPException(413, "Arquivo maior que 3 MB. Selecione um período menor.")
    try:
        contents = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(400, "Salve o CSV com codificação UTF-8.")
    try:
        dialect = csv.Sniffer().sniff(contents[:4096], delimiters=",;")
        rows = list(csv.DictReader(StringIO(contents), dialect=dialect))
    except csv.Error:
        raise HTTPException(400, "Não foi possível ler o CSV.")
    if not rows:
        raise HTTPException(400, "O arquivo não contém registros.")
    missing = set(CSV_COLUMNS) - set(rows[0])
    if missing:
        raise HTTPException(400, "Colunas ausentes: " + ", ".join(sorted(missing)))
    if len(rows) > 10000:
        raise HTTPException(400, "Máximo de 10.000 registros por importação.")
    result = []
    previous = None
    for n, row in enumerate(rows, start=2):
        try:
            moment = datetime.fromisoformat(row["timestamp"].strip())
            if moment.tzinfo is not None:
                raise ValueError("timezone")
            if previous is not None and moment <= previous:
                raise ValueError("timestamps fora de ordem ou duplicados")
            previous = moment
            t = [float(row[f"temp_{a}"].replace(",", ".")) for a in AREAS]
            h = [float(row[f"rh_{a}"].replace(",", ".")) for a in AREAS]
            if any(not math.isfinite(x) for x in t+h):
                raise ValueError("NaN ou infinito")
            if any(x < -50 or x > 80 for x in t):
                raise ValueError("temperatura fora de -50 a 80 °C")
            if any(x < 0 or x > 100 for x in h):
                raise ValueError("umidade relativa fora de 0 a 100%")
        except (ValueError, TypeError, KeyError, AttributeError) as e:
            raise HTTPException(400, f"Linha {n} inválida ({str(e)}). Use data ISO AAAA-MM-DDTHH:MM:SS e números válidos.")
        dif = np.array(t) @ TRANSFORM
        result.append({
            "timestamp": moment.isoformat(),
            "temperature": dict(zip(AREAS, t)),
            "humidity": dict(zip(AREAS, h)),
            "differences": {
                "pasto_menos_secundaria": round(float(dif[0]), 4),
                "pasto_menos_primaria": round(float(dif[1]), 4),
            },
        })
    uploaded_records = result
    return {"status": "ok", "count": len(result), "source": "uploaded_csv"}

@app.delete("/api/data/import")
def reset_import():
    global uploaded_records
    uploaded_records = None
    return {"status": "ok", "source": "field_data" if bundled_records is not None else "synthetic_demo"}
