from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Response, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "venteflash-auto"
storage_key = None

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Object Storage helpers ──────────────────────────────────────────

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ── Pydantic Models ─────────────────────────────────────────────────

class VehicleIdentifyRequest(BaseModel):
    immatriculation: str

class VehicleIdentifyResponse(BaseModel):
    found: bool
    marque: str = ""
    modele: str = ""
    version: str = ""
    annee: str = ""
    carburant: str = ""

class VehicleInfo(BaseModel):
    immatriculation: str = ""
    marque: str = ""
    modele: str = ""
    version: str = ""
    kilometrage: str = ""
    etat: str = ""
    roulant: Optional[bool] = None
    importe: Optional[bool] = None
    premiere_main: Optional[bool] = None
    carnet_entretien: Optional[bool] = None
    factures_entretien: Optional[bool] = None
    defauts: str = ""
    annee: str = ""
    carburant: str = ""

class ClientInfo(BaseModel):
    nom: str = ""
    prenom: str = ""
    email: str = ""
    telephone: str = ""
    code_postal: str = ""

class RdvInfo(BaseModel):
    date: str = ""
    heure: str = ""
    centre: str = ""

class LeadCreate(BaseModel):
    vehicule: VehicleInfo
    client: ClientInfo
    rdv: RdvInfo
    photos: List[str] = []
    estimation: Optional[float] = None

class LeadResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vehicule: VehicleInfo
    client: ClientInfo
    rdv: RdvInfo
    photos: List[str] = []
    estimation: Optional[float] = None
    status: str = "new"
    created_at: str = ""

class PartialLeadCreate(BaseModel):
    step: int
    data: dict

class TrackingEvent(BaseModel):
    event: str
    properties: dict = {}

# ── Mock vehicle database (replace with Autobiz API) ────────────────

MOCK_VEHICLES = {
    "AA123BB": {"marque": "Peugeot", "modele": "208", "version": "1.2 PureTech 100 Active", "annee": "2020", "carburant": "Essence"},
    "CC456DD": {"marque": "Renault", "modele": "Clio V", "version": "1.0 TCe 100 Intens", "annee": "2021", "carburant": "Essence"},
    "EE789FF": {"marque": "Citroen", "modele": "C3", "version": "1.2 PureTech 83 Feel", "annee": "2019", "carburant": "Essence"},
    "GG012HH": {"marque": "Volkswagen", "modele": "Golf 8", "version": "1.5 TSI 150 Style", "annee": "2022", "carburant": "Essence"},
    "KK345LL": {"marque": "BMW", "modele": "Serie 3", "version": "320d xDrive M Sport", "annee": "2021", "carburant": "Diesel"},
    "MM678NN": {"marque": "Mercedes", "modele": "Classe A", "version": "A 200 AMG Line", "annee": "2020", "carburant": "Essence"},
    "PP901QQ": {"marque": "Audi", "modele": "A3", "version": "35 TFSI S Line", "annee": "2022", "carburant": "Essence"},
    "AB123CD": {"marque": "Toyota", "modele": "Yaris", "version": "1.5 Hybride Dynamic", "annee": "2023", "carburant": "Hybride"},
}

def identify_vehicle_mock(immatriculation: str) -> dict:
    """Mock for Autobiz API. Replace this function with real API call."""
    clean = immatriculation.upper().replace("-", "").replace(" ", "")
    if clean in MOCK_VEHICLES:
        return {"found": True, **MOCK_VEHICLES[clean]}
    # Generate a plausible response for any plate format
    import random
    brands = [
        {"marque": "Peugeot", "modele": "308", "version": "1.5 BlueHDi 130 Allure"},
        {"marque": "Renault", "modele": "Megane", "version": "1.3 TCe 140 Techno"},
        {"marque": "Citroen", "modele": "C4", "version": "1.2 PureTech 130 Shine"},
        {"marque": "Dacia", "modele": "Sandero", "version": "1.0 TCe 90 Stepway"},
        {"marque": "Fiat", "modele": "500", "version": "1.0 Hybrid 70 Lounge"},
    ]
    chosen = random.choice(brands)
    year = str(random.randint(2017, 2024))
    fuel = random.choice(["Essence", "Diesel", "Hybride"])
    return {"found": True, **chosen, "annee": year, "carburant": fuel}

def estimate_vehicle_price(vehicle_data: dict) -> float:
    """Generate a plausible estimation based on vehicle data."""
    import random
    base_prices = {
        "Peugeot": 10000, "Renault": 9500, "Citroen": 9000, "Volkswagen": 14000,
        "BMW": 22000, "Mercedes": 23000, "Audi": 20000, "Toyota": 13000,
        "Dacia": 8000, "Fiat": 7000,
    }
    base = base_prices.get(vehicle_data.get("marque", ""), 11000)
    year = int(vehicle_data.get("annee", "2020"))
    age_factor = max(0.4, 1 - (2026 - year) * 0.08)
    return round(base * age_factor + random.randint(-500, 1500), -2)

# ── API Routes ───────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "VenteFlash Auto API"}

@api_router.post("/vehicle/identify", response_model=VehicleIdentifyResponse)
async def identify_vehicle(req: VehicleIdentifyRequest):
    result = identify_vehicle_mock(req.immatriculation)
    return VehicleIdentifyResponse(**result)

@api_router.post("/vehicle/estimate")
async def estimate_vehicle(req: dict):
    price = estimate_vehicle_price(req)
    return {"estimation": price}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    allowed = {"jpg", "jpeg", "png", "webp", "gif", "heic"}
    if ext.lower() not in allowed:
        raise HTTPException(400, f"Type de fichier non autorise: .{ext}")
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(400, "Fichier trop volumineux (max 10 Mo)")
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext.lower()}"
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    result = put_object(path, data, content_type)
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Fichier non trouve")
    data, ct = get_object(path)
    return Response(content=data, media_type=record.get("content_type", ct))

@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(lead: LeadCreate):
    lead_id = str(uuid.uuid4())
    doc = {
        "id": lead_id,
        "vehicule": lead.vehicule.model_dump(),
        "client": lead.client.model_dump(),
        "rdv": lead.rdv.model_dump(),
        "photos": lead.photos,
        "estimation": lead.estimation,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "website",
    }
    await db.leads.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("source", None)
    return LeadResponse(**doc)

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads():
    leads = await db.leads.find({}, {"_id": 0, "source": 0}).to_list(1000)
    return [LeadResponse(**l) for l in leads]

@api_router.post("/leads/partial")
async def save_partial_lead(data: PartialLeadCreate):
    partial_id = str(uuid.uuid4())
    doc = {
        "id": partial_id,
        "step": data.step,
        "data": data.data,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "converted": False,
    }
    await db.partial_leads.insert_one(doc)
    return {"id": partial_id, "saved": True}

@api_router.get("/appointments/slots")
async def get_appointment_slots(date: str = Query(None)):
    """Return available time slots for a given date."""
    slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"]
    return {"date": date, "slots": slots}

@api_router.get("/centers")
async def get_centers():
    centers = [
        {"id": "paris", "name": "Paris - Nation", "address": "12 Rue de la Roquette, 75011 Paris", "phone": "01 42 00 00 00", "code_postal_prefix": "75"},
        {"id": "lyon", "name": "Lyon - Part-Dieu", "address": "45 Rue Garibaldi, 69003 Lyon", "phone": "04 72 00 00 00", "code_postal_prefix": "69"},
        {"id": "marseille", "name": "Marseille - Prado", "address": "88 Avenue du Prado, 13008 Marseille", "phone": "04 91 00 00 00", "code_postal_prefix": "13"},
        {"id": "toulouse", "name": "Toulouse - Capitole", "address": "22 Allees Jean Jaures, 31000 Toulouse", "phone": "05 61 00 00 00", "code_postal_prefix": "31"},
        {"id": "bordeaux", "name": "Bordeaux - Meriadeck", "address": "15 Rue du Chateau d'Eau, 33000 Bordeaux", "phone": "05 56 00 00 00", "code_postal_prefix": "33"},
    ]
    return {"centers": centers}

@api_router.post("/tracking")
async def track_event(event: TrackingEvent):
    doc = {
        "id": str(uuid.uuid4()),
        "event": event.event,
        "properties": event.properties,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.tracking_events.insert_one(doc)
    return {"tracked": True}

# ── App setup ────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Object storage initialized successfully")
    except Exception as e:
        logger.error(f"Storage init failed (will retry on first upload): {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
