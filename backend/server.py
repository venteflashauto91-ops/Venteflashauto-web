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
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from services import autobiz_service, pricing_service, hubspot_service, webhook_service
from services.utm_utils import extract_utm

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
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ── Pydantic Models ─────────────────────────────────────────────────

class IdentifyRequest(BaseModel):
    plate: str

class QuoteRequest(BaseModel):
    vehicle: Dict[str, Any]
    mileage: int

class LeadSaveRequest(BaseModel):
    plate: str = ""
    vehicle: Dict[str, Any] = {}
    mileage: int = 0
    is_drivable: bool = True
    condition: str = ""
    defects: str = ""
    first_owner: bool = False
    service_book: bool = False
    service_invoices: bool = False
    imported: bool = False
    client: Dict[str, Any] = {}
    pricing: Dict[str, Any] = {}
    photos: List[str] = []
    utm: Dict[str, str] = {}
    source: str = "website"

class RangeCreate(BaseModel):
    start_value: float
    end_value: float
    range_value: float

class TrackingEvent(BaseModel):
    event: str
    properties: dict = {}

# ── AUTOBIZ ROUTES (backend-only, secure) ───────────────────────────

@api_router.post("/autobiz/identify")
async def autobiz_identify(req: IdentifyRequest):
    """Identify vehicle via Autobiz. All credentials stay server-side."""
    result = await autobiz_service.identify_vehicle(req.plate)
    if not result.get("found"):
        raise HTTPException(404, detail=result.get("error", "Vehicule non trouve"))
    # Strip raw Autobiz response from client output
    result.pop("raw", None)
    return result

@api_router.post("/autobiz/quote")
async def autobiz_quote(req: QuoteRequest):
    """Get price quotation from Autobiz + apply range pricing."""
    quotation = await autobiz_service.get_quotation(req.vehicle, req.mileage)
    base_price = quotation.get("base_price", 0)
    pricing = await pricing_service.calculate_final_price(db, base_price)
    # Strip raw
    quotation.pop("raw", None)
    return {
        "quotation": quotation,
        "pricing": pricing,
        "market_value_type": autobiz_service.AUTOBIZ_MARKET_VALUE,
    }

# ── LEADS ROUTES ────────────────────────────────────────────────────

@api_router.post("/leads/save")
async def save_lead(lead: LeadSaveRequest):
    """Save a complete lead to database, optionally push to HubSpot/webhook."""
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": lead_id,
        "plate": lead.plate,
        "vehicle": lead.vehicle,
        "mileage": lead.mileage,
        "is_drivable": lead.is_drivable,
        "condition": lead.condition,
        "defects": lead.defects,
        "first_owner": lead.first_owner,
        "service_book": lead.service_book,
        "service_invoices": lead.service_invoices,
        "imported": lead.imported,
        "client": lead.client,
        "pricing": lead.pricing,
        "photos": lead.photos,
        "utm": lead.utm,
        "source": lead.source,
        "status": "new",
        "created_at": now,
        "hubspot": None,
        "webhook": None,
    }

    # Save to DB
    await db.car_leads.insert_one(doc)

    # Optional: HubSpot
    hubspot_result = await hubspot_service.create_contact({
        "client": lead.client,
        "vehicle": lead.vehicle,
        "final_price": lead.pricing.get("final_price", 0),
    })
    doc["hubspot"] = hubspot_result

    # Optional: Webhook
    webhook_data = {k: v for k, v in doc.items() if k != "_id"}
    webhook_result = await webhook_service.send_lead(webhook_data)
    doc["webhook"] = webhook_result

    # Update integrations status
    await db.car_leads.update_one(
        {"id": lead_id},
        {"$set": {"hubspot": hubspot_result, "webhook": webhook_result}},
    )

    return {
        "id": lead_id,
        "status": "saved",
        "hubspot": hubspot_result.get("sent", False),
        "webhook": webhook_result.get("sent", False),
    }

@api_router.get("/leads")
async def get_leads(limit: int = 100):
    leads = await db.car_leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"leads": leads, "total": len(leads)}

# ── RANGES ROUTES ───────────────────────────────────────────────────

@api_router.get("/ranges")
async def get_ranges():
    ranges = await db.ranges.find({}, {"_id": 0}).sort("start_value", 1).to_list(100)
    return {"ranges": ranges}

@api_router.post("/ranges")
async def create_range(r: RangeCreate):
    range_id = str(uuid.uuid4())
    doc = {
        "id": range_id,
        "start_value": r.start_value,
        "end_value": r.end_value,
        "range_value": r.range_value,
    }
    await db.ranges.insert_one(doc)
    return {"id": range_id, "created": True}

@api_router.delete("/ranges/{range_id}")
async def delete_range(range_id: str):
    result = await db.ranges.delete_one({"id": range_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Range not found")
    return {"deleted": True}

# ── SETTINGS ROUTES ─────────────────────────────────────────────────

@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"key": "global"}, {"_id": 0})
    if not settings:
        settings = {
            "key": "global",
            "autobiz_market_value": autobiz_service.AUTOBIZ_MARKET_VALUE,
            "default_discount_percent": pricing_service.DEFAULT_DISCOUNT_PERCENT,
            "autobiz_configured": autobiz_service.is_configured(),
            "hubspot_enabled": hubspot_service.ENABLE_HUBSPOT,
            "webhook_enabled": webhook_service.ENABLE_WEBHOOK,
        }
    return settings

# ── UPLOAD ROUTES ───────────────────────────────────────────────────

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
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Fichier non trouve")
    data, ct = get_object(path)
    return Response(content=data, media_type=record.get("content_type", ct))

# ── CENTERS & APPOINTMENTS ──────────────────────────────────────────

@api_router.get("/centers")
async def get_centers():
    return {"centers": [
        {"id": "paris", "name": "Paris - Nation", "address": "12 Rue de la Roquette, 75011 Paris", "phone": "01 42 00 00 00", "code_postal_prefix": "75"},
        {"id": "lyon", "name": "Lyon - Part-Dieu", "address": "45 Rue Garibaldi, 69003 Lyon", "phone": "04 72 00 00 00", "code_postal_prefix": "69"},
        {"id": "marseille", "name": "Marseille - Prado", "address": "88 Avenue du Prado, 13008 Marseille", "phone": "04 91 00 00 00", "code_postal_prefix": "13"},
        {"id": "toulouse", "name": "Toulouse - Capitole", "address": "22 Allees Jean Jaures, 31000 Toulouse", "phone": "05 61 00 00 00", "code_postal_prefix": "31"},
        {"id": "bordeaux", "name": "Bordeaux - Meriadeck", "address": "15 Rue du Chateau d'Eau, 33000 Bordeaux", "phone": "05 56 00 00 00", "code_postal_prefix": "33"},
    ]}

@api_router.get("/appointments/slots")
async def get_appointment_slots(date: str = Query(None)):
    return {"date": date, "slots": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"]}

# ── TRACKING ────────────────────────────────────────────────────────

@api_router.post("/tracking")
async def track_event(event: TrackingEvent):
    await db.tracking_events.insert_one({
        "id": str(uuid.uuid4()),
        "event": event.event,
        "properties": event.properties,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return {"tracked": True}

# ── HEALTH ──────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"status": "ok", "autobiz_configured": autobiz_service.is_configured()}

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
    # Init storage
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

    # Seed default ranges if empty
    count = await db.ranges.count_documents({})
    if count == 0:
        default_ranges = [
            {"id": str(uuid.uuid4()), "start_value": 0, "end_value": 3000, "range_value": -25},
            {"id": str(uuid.uuid4()), "start_value": 3000, "end_value": 5000, "range_value": -20},
            {"id": str(uuid.uuid4()), "start_value": 5000, "end_value": 10000, "range_value": -15},
            {"id": str(uuid.uuid4()), "start_value": 10000, "end_value": 20000, "range_value": -12},
            {"id": str(uuid.uuid4()), "start_value": 20000, "end_value": 50000, "range_value": -10},
            {"id": str(uuid.uuid4()), "start_value": 50000, "end_value": 200000, "range_value": -8},
        ]
        await db.ranges.insert_many(default_ranges)
        logger.info(f"Seeded {len(default_ranges)} default ranges")

    logger.info(f"Autobiz configured: {autobiz_service.is_configured()}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
