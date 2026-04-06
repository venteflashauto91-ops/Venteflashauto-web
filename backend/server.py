from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Response, Query, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests
import io
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from PIL import Image as PILImage

from services import autobiz_service, pricing_service, hubspot_service, webhook_service
from services import admin_service, settings_loader
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

class EstimateRequest(BaseModel):
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
    photos: List[str] = []
    utm: Dict[str, str] = {}
    source: str = "website"
    tracking: Dict[str, str] = {}

class AppointmentBookRequest(BaseModel):
    garage_id: str
    garage_name: str
    appointment_date: str
    appointment_time: str
    client_firstname: str = ""
    client_lastname: str = ""
    client_phone: str = ""

class RangeCreate(BaseModel):
    start_value: float
    end_value: float
    range_value: float

class TrackingEvent(BaseModel):
    event: str
    properties: dict = {}

class AdminLoginRequest(BaseModel):
    password: str

class AdminSettingsUpdate(BaseModel):
    autobiz_base_url: Optional[str] = None
    autobiz_market_value: Optional[str] = None
    autobiz_username: Optional[str] = None
    autobiz_password: Optional[str] = None
    default_discount_percent: Optional[float] = None
    enable_hubspot: Optional[bool] = None
    hubspot_api_key: Optional[str] = None
    enable_webhook: Optional[bool] = None
    webhook_url: Optional[str] = None
    enable_webhook_appointment: Optional[bool] = None
    webhook_appointment_url: Optional[str] = None

class GarageCreate(BaseModel):
    name: str
    address: str = ""
    postal_code: str = ""
    city: str = ""
    phone: str = ""
    email: str = ""
    hours: str = ""
    active: bool = True
    display_order: int = 0
    notes: str = ""
    zone: str = ""

class AppointmentConfigUpdate(BaseModel):
    active_days: List[int] = [1, 2, 3, 4, 5]
    slots: List[str] = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
    slot_duration: int = 60
    max_per_slot: int = 1
    disabled_dates: List[str] = []

# ── Admin auth dependency ────────────────────────────────────────────

async def require_admin(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Token manquant")
    token = auth[7:]
    if not admin_service.verify_token(token):
        raise HTTPException(401, "Token invalide ou expire")
    return True

# ── AUTOBIZ ROUTES (backend-only, secure) ───────────────────────────

@api_router.post("/autobiz/identify")
async def autobiz_identify(req: IdentifyRequest):
    result = await autobiz_service.identify_vehicle(req.plate)
    if not result.get("found"):
        raise HTTPException(404, detail=result.get("error", "Vehicule non trouve"))
    result.pop("raw", None)
    return result

@api_router.post("/autobiz/quote")
async def autobiz_quote(req: QuoteRequest):
    quotation = await autobiz_service.get_quotation(req.vehicle, req.mileage)
    base_price = quotation.get("base_price", 0)
    pricing = await pricing_service.calculate_final_price(db, base_price)
    quotation.pop("raw", None)
    return {
        "quotation": quotation,
        "pricing": pricing,
        "market_value_type": autobiz_service.AUTOBIZ_MARKET_VALUE,
    }

# ── LEADS ROUTES ────────────────────────────────────────────────────

@api_router.post("/leads/estimate")
async def estimate_lead(req: EstimateRequest, request: Request):
    """
    New funnel endpoint:
    1. Compute price server-side
    2. Save lead with lead_status=estimated
    3. Send webhook N8N (non-blocking on failure)
    4. Return lead_id + price
    """
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # ── Server-side pricing ──
    if req.is_drivable:
        quotation = await autobiz_service.get_quotation(req.vehicle, req.mileage)
        base_price = quotation.get("base_price", 0)
        final_pricing = await pricing_service.calculate_final_price(db, base_price)
    else:
        final_pricing = {"base_price": 0, "range_price": None, "discount_price": None, "final_price": 0, "discount_percent": 0, "range_used": None}

    price = final_pricing.get("final_price", 0)

    # ── Enrich tracking ──
    tracking = {**req.utm, **req.tracking}
    tracking["user_agent"] = request.headers.get("user-agent", "")
    tracking["ip"] = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "")
    tracking["referrer"] = request.headers.get("referer", "")

    # ── Build photo URLs for webhook ──
    backend_url = os.environ.get("REACT_APP_BACKEND_URL", request.base_url.scheme + "://" + request.headers.get("host", ""))
    photo_urls = [f"{backend_url}/api/files/{p}" for p in req.photos] if req.photos else []

    doc = {
        "id": lead_id,
        "plate": req.plate,
        "vehicle": req.vehicle,
        "mileage": req.mileage,
        "is_drivable": req.is_drivable,
        "condition": req.condition,
        "defects": req.defects,
        "first_owner": req.first_owner,
        "service_book": req.service_book,
        "service_invoices": req.service_invoices,
        "imported": req.imported,
        "client": req.client,
        "pricing": final_pricing,
        "photos": req.photos,
        "photo_urls": photo_urls,
        "tracking": tracking,
        "source": req.source,
        "lead_status": "estimated",
        "garage_id": None,
        "garage_name": None,
        "appointment_date": None,
        "appointment_time": None,
        "appointment_datetime": None,
        "appointment_status": None,
        "webhook_estimation": None,
        "webhook_appointment": None,
        "hubspot": None,
        "created_at": now,
        "updated_at": now,
    }

    # ── 1. Save to DB FIRST ──
    await db.car_leads.insert_one(doc)
    logger.info(f"Lead saved: {lead_id} (status=estimated, drivable={req.is_drivable})")

    # ── 2. Webhook N8N (non-blocking on failure) ──
    webhook_result = {"sent": False, "reason": "not_attempted"}
    try:
        webhook_doc = {k: v for k, v in doc.items() if k != "_id"}
        webhook_result = await webhook_service.send_lead(webhook_doc)
    except Exception as e:
        logger.error(f"Webhook estimation failed: {e}")
        webhook_result = {"sent": False, "error": str(e)}

    # ── 3. Update webhook result in DB ──
    await db.car_leads.update_one(
        {"id": lead_id},
        {"$set": {"webhook_estimation": webhook_result}}
    )

    # ── 4. HubSpot (non-blocking) ──
    hubspot_result = {"sent": False, "reason": "not_attempted"}
    try:
        hubspot_data = {**{k: v for k, v in doc.items() if k != "_id"}, "price": price}
        hubspot_result = await hubspot_service.create_contact_and_deal(hubspot_data)
    except Exception as e:
        logger.error(f"HubSpot failed: {e}")
        hubspot_result = {"sent": False, "error": str(e)}

    await db.car_leads.update_one(
        {"id": lead_id},
        {"$set": {"hubspot": hubspot_result}}
    )

    # ── Return lead_id + price (frontend redirects after this) ──
    return {
        "lead_id": lead_id,
        "price": price,
        "is_drivable": req.is_drivable,
        "webhook_sent": webhook_result.get("sent", False),
        "success": True,
    }


@api_router.get("/leads/{lead_id}/result")
async def get_lead_result(lead_id: str):
    """
    Get lead data for the estimation result page.
    Returns pricing, vehicle info, and appointment status.
    Refresh-safe: all data comes from DB.
    """
    lead = await db.car_leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(404, "Lead non trouve")

    return {
        "id": lead["id"],
        "plate": lead.get("plate", ""),
        "vehicle": lead.get("vehicle", {}),
        "mileage": lead.get("mileage", 0),
        "is_drivable": lead.get("is_drivable", True),
        "pricing": lead.get("pricing", {}),
        "lead_status": lead.get("lead_status", "estimated"),
        "garage_id": lead.get("garage_id"),
        "garage_name": lead.get("garage_name"),
        "appointment_date": lead.get("appointment_date"),
        "appointment_time": lead.get("appointment_time"),
        "appointment_datetime": lead.get("appointment_datetime"),
        "appointment_status": lead.get("appointment_status"),
        "client": lead.get("client", {}),
        "photos": lead.get("photos", []),
        "created_at": lead.get("created_at"),
    }


@api_router.put("/leads/{lead_id}/appointment")
async def book_appointment(lead_id: str, req: AppointmentBookRequest, request: Request):
    """
    Book an appointment for an existing lead.
    Updates lead_status from 'estimated' to 'appointment_scheduled'.
    Uses atomic operation to prevent double booking.
    """
    # Verify lead exists
    lead = await db.car_leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(404, "Lead non trouve")

    now = datetime.now(timezone.utc).isoformat()
    appointment_datetime = f"{req.appointment_date}T{req.appointment_time}:00"

    # ── Atomic slot booking (prevent double reservation) ──
    appt_config = await db.appointment_config.find_one({"key": "global"}, {"_id": 0})
    max_per_slot = appt_config.get("max_per_slot", 1) if appt_config else 1

    # Use find_one_and_update with condition for atomicity
    appt_id = str(uuid.uuid4())
    # First count existing - then insert only if under limit
    existing_count = await db.appointments.count_documents({
        "garage_id": req.garage_id,
        "date": req.appointment_date,
        "time": req.appointment_time,
        "status": "scheduled",
    })

    if existing_count >= max_per_slot:
        raise HTTPException(409, "Ce creneau n'est plus disponible. Veuillez en choisir un autre.")

    # Insert appointment
    await db.appointments.insert_one({
        "id": appt_id,
        "garage_id": req.garage_id,
        "date": req.appointment_date,
        "time": req.appointment_time,
        "lead_id": lead_id,
        "status": "scheduled",
        "created_at": now,
    })

    # ── Update lead with appointment info + contact ──
    update_fields = {
        "lead_status": "appointment_scheduled",
        "garage_id": req.garage_id,
        "garage_name": req.garage_name,
        "appointment_date": req.appointment_date,
        "appointment_time": req.appointment_time,
        "appointment_datetime": appointment_datetime,
        "appointment_status": "scheduled",
        "updated_at": now,
    }
    # Update client contact if provided
    if req.client_firstname or req.client_lastname or req.client_phone:
        update_fields["client.firstname"] = req.client_firstname or lead.get("client", {}).get("firstname", "")
        update_fields["client.lastname"] = req.client_lastname or lead.get("client", {}).get("lastname", "")
        update_fields["client.phone"] = req.client_phone or lead.get("client", {}).get("phone", "")

    await db.car_leads.update_one(
        {"id": lead_id},
        {"$set": update_fields}
    )

    logger.info(f"Appointment booked: lead={lead_id}, garage={req.garage_id}, date={req.appointment_date} {req.appointment_time}")

    # ── Webhook 2 (appointment, optional, non-blocking) ──
    webhook_appt_result = {"sent": False, "reason": "not_attempted"}
    try:
        webhook_appt_result = await webhook_service.send_appointment_update({
            "lead_id": lead_id,
            "lead_status": "appointment_scheduled",
            "garage_id": req.garage_id,
            "garage_name": req.garage_name,
            "appointment_date": req.appointment_date,
            "appointment_time": req.appointment_time,
            "appointment_datetime": appointment_datetime,
            "client": lead.get("client", {}),
            "vehicle": lead.get("vehicle", {}),
            "plate": lead.get("plate", ""),
            "pricing": lead.get("pricing", {}),
        })
    except Exception as e:
        logger.error(f"Webhook appointment failed: {e}")
        webhook_appt_result = {"sent": False, "error": str(e)}

    await db.car_leads.update_one(
        {"id": lead_id},
        {"$set": {"webhook_appointment": webhook_appt_result}}
    )

    return {
        "success": True,
        "lead_id": lead_id,
        "lead_status": "appointment_scheduled",
        "appointment_id": appt_id,
        "garage_name": req.garage_name,
        "appointment_date": req.appointment_date,
        "appointment_time": req.appointment_time,
        "webhook_sent": webhook_appt_result.get("sent", False),
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
    doc = {"id": range_id, "start_value": r.start_value, "end_value": r.end_value, "range_value": r.range_value}
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
    headers = {}
    if "seo/" in path:
        headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return Response(content=data, media_type=record.get("content_type", ct), headers=headers)

# ── GARAGES & APPOINTMENTS (public) ──────────────────────────────────

# Default form config
FORM_CONFIG_DEFAULTS = {
    "key": "global",
    "fields": {
        "additional_info": {"enabled": True, "required": True, "label": "Informations complementaires"},
        "photos": {"enabled": True, "required": False, "label": "Photos du vehicule"},
        "firstname": {"enabled": True, "required": True, "label": "Prenom"},
        "lastname": {"enabled": True, "required": True, "label": "Nom"},
        "email": {"enabled": True, "required": True, "label": "Email"},
        "phone": {"enabled": True, "required": True, "label": "Telephone"},
        "postal_code": {"enabled": True, "required": False, "label": "Code postal"},
    }
}

@api_router.get("/form-config")
async def get_form_config():
    """Public endpoint: frontend loads this to configure the form."""
    config = await db.form_config.find_one({"key": "global"}, {"_id": 0})
    if not config:
        return FORM_CONFIG_DEFAULTS
    # Merge defaults for any missing fields
    merged = {**FORM_CONFIG_DEFAULTS}
    merged["fields"] = {**FORM_CONFIG_DEFAULTS["fields"]}
    for field_key, field_val in (config.get("fields") or {}).items():
        if field_key in merged["fields"]:
            merged["fields"][field_key] = {**merged["fields"][field_key], **field_val}
    return merged

@api_router.get("/admin/form-config")
async def admin_get_form_config(request: Request):
    await require_admin(request)
    config = await db.form_config.find_one({"key": "global"}, {"_id": 0})
    if not config:
        return FORM_CONFIG_DEFAULTS
    merged = {**FORM_CONFIG_DEFAULTS}
    merged["fields"] = {**FORM_CONFIG_DEFAULTS["fields"]}
    for field_key, field_val in (config.get("fields") or {}).items():
        if field_key in merged["fields"]:
            merged["fields"][field_key] = {**merged["fields"][field_key], **field_val}
    return merged

@api_router.post("/admin/form-config")
async def admin_update_form_config(request: Request):
    await require_admin(request)
    body = await request.json()
    fields = body.get("fields", {})
    doc = {"key": "global", "fields": fields}
    await db.form_config.update_one({"key": "global"}, {"$set": doc}, upsert=True)
    return doc

@api_router.get("/garages")
async def get_garages(postal_code: str = Query(None)):
    garages = await db.garages.find({"active": True}, {"_id": 0}).sort("display_order", 1).to_list(100)
    if postal_code and len(postal_code) >= 2:
        prefix = postal_code[:2]
        garages.sort(key=lambda g: (0 if g.get("postal_code", "")[:2] == prefix else 1, g.get("display_order", 0)))
    return {"garages": garages}

@api_router.get("/appointments/config")
async def get_appointment_config():
    config = await db.appointment_config.find_one({"key": "global"}, {"_id": 0})
    if not config:
        config = {"key": "global", "active_days": [1, 2, 3, 4, 5], "slots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"], "slot_duration": 60, "max_per_slot": 1, "disabled_dates": []}
    return config

@api_router.get("/appointments/available")
async def get_available_slots(garage_id: str = Query(...), date: str = Query(...)):
    config = await db.appointment_config.find_one({"key": "global"}, {"_id": 0})
    if not config:
        config = {"slots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"], "max_per_slot": 1, "disabled_dates": []}

    if date in config.get("disabled_dates", []):
        return {"date": date, "garage_id": garage_id, "slots": [], "message": "Date non disponible"}

    max_per_slot = config.get("max_per_slot", 1)
    all_slots = config.get("slots", [])

    booked = {}
    cursor = db.appointments.find({"garage_id": garage_id, "date": date, "status": "scheduled"}, {"_id": 0, "time": 1})
    async for appt in cursor:
        t = appt["time"]
        booked[t] = booked.get(t, 0) + 1

    available = [s for s in all_slots if booked.get(s, 0) < max_per_slot]
    return {"date": date, "garage_id": garage_id, "slots": available, "all_slots": all_slots, "booked": list(booked.keys())}

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

# ── ADMIN ROUTES (protected by JWT) ──────────────────────────────────

@api_router.post("/admin/login")
async def admin_login(req: AdminLoginRequest):
    if not admin_service.verify_admin_password(req.password):
        raise HTTPException(401, "Mot de passe incorrect")
    token = admin_service.create_token()
    return {"token": token, "expires_in": admin_service.JWT_EXPIRY_HOURS * 3600}

@api_router.get("/admin/settings")
async def admin_get_settings(request: Request):
    await require_admin(request)
    settings = await admin_service.get_settings(db, mask_secrets=True)
    return settings

@api_router.post("/admin/settings")
async def admin_update_settings(updates: AdminSettingsUpdate, request: Request):
    await require_admin(request)
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    result = await admin_service.update_settings(db, update_dict)
    settings_loader.invalidate_cache()
    return result

@api_router.get("/admin/leads")
async def admin_get_leads(
    request: Request,
    limit: int = 200,
    skip: int = 0,
    search: Optional[str] = None,
    lead_status: Optional[str] = None,
    has_appointment: Optional[bool] = None,
    garage_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    plate: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    postal_code: Optional[str] = None,
    make: Optional[str] = None,
    is_drivable: Optional[bool] = None,
):
    """Get leads with advanced filtering and pagination."""
    await require_admin(request)

    query = {}

    # Free text search across multiple fields
    if search:
        s = search.strip()
        query["$or"] = [
            {"client.firstname": {"$regex": s, "$options": "i"}},
            {"client.lastname": {"$regex": s, "$options": "i"}},
            {"client.email": {"$regex": s, "$options": "i"}},
            {"client.phone": {"$regex": s, "$options": "i"}},
            {"plate": {"$regex": s, "$options": "i"}},
            {"vehicle.make": {"$regex": s, "$options": "i"}},
            {"vehicle.model": {"$regex": s, "$options": "i"}},
            {"id": {"$regex": s, "$options": "i"}},
        ]

    if lead_status:
        query["lead_status"] = lead_status
    if has_appointment is True:
        query["appointment_status"] = "scheduled"
    elif has_appointment is False:
        if "$or" in query:
            query["$and"] = [{"$or": query.pop("$or")}, {"$or": [{"appointment_status": None}, {"appointment_status": {"$exists": False}}]}]
        else:
            query["$or"] = [{"appointment_status": None}, {"appointment_status": {"$exists": False}}]
    if garage_id:
        query["garage_id"] = garage_id
    if date_from:
        query.setdefault("created_at", {})["$gte"] = date_from
    if date_to:
        query.setdefault("created_at", {})["$lte"] = date_to + "T23:59:59"
    if plate:
        query["plate"] = {"$regex": plate.strip(), "$options": "i"}
    if email:
        query["client.email"] = {"$regex": email.strip(), "$options": "i"}
    if phone:
        query["client.phone"] = {"$regex": phone.strip(), "$options": "i"}
    if postal_code:
        query["client.postal_code"] = {"$regex": f"^{postal_code.strip()}"}
    if make:
        query["vehicle.make"] = {"$regex": make.strip(), "$options": "i"}
    if is_drivable is not None:
        query["is_drivable"] = is_drivable

    total = await db.car_leads.count_documents(query)
    leads = await db.car_leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"leads": leads, "total": total, "limit": limit, "skip": skip}

@api_router.get("/admin/ranges")
async def admin_get_ranges(request: Request):
    await require_admin(request)
    ranges = await db.ranges.find({}, {"_id": 0}).sort("start_value", 1).to_list(100)
    return {"ranges": ranges}

@api_router.post("/admin/ranges")
async def admin_create_range(r: RangeCreate, request: Request):
    await require_admin(request)
    range_id = str(uuid.uuid4())
    doc = {"id": range_id, "start_value": r.start_value, "end_value": r.end_value, "range_value": r.range_value}
    await db.ranges.insert_one(doc)
    return {"id": range_id, "created": True}

@api_router.delete("/admin/ranges/{range_id}")
async def admin_delete_range(range_id: str, request: Request):
    await require_admin(request)
    result = await db.ranges.delete_one({"id": range_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Range non trouvee")
    return {"deleted": True}

@api_router.get("/admin/stats")
async def admin_stats(request: Request):
    await require_admin(request)
    total_leads = await db.car_leads.count_documents({})
    estimated_leads = await db.car_leads.count_documents({"lead_status": "estimated"})
    appointed_leads = await db.car_leads.count_documents({"lead_status": "appointment_scheduled"})
    drivable_leads = await db.car_leads.count_documents({"is_drivable": True})
    non_drivable_leads = await db.car_leads.count_documents({"is_drivable": False})
    total_garages = await db.garages.count_documents({})
    total_appointments = await db.appointments.count_documents({})

    # Legacy leads without lead_status
    legacy_leads = await db.car_leads.count_documents({"lead_status": {"$exists": False}})

    conversion_rate = round((appointed_leads / estimated_leads * 100), 1) if estimated_leads > 0 else 0

    cfg = await admin_service.get_settings(db, mask_secrets=True)
    autobiz_ok = bool(cfg.get("autobiz_username") and cfg.get("autobiz_base_url"))

    # Webhook failures
    webhook_failures = await db.car_leads.count_documents({
        "$or": [
            {"webhook_estimation.sent": False, "webhook_estimation.error": {"$exists": True}},
            {"webhook_appointment.sent": False, "webhook_appointment.error": {"$exists": True}},
        ]
    })

    return {
        "total_leads": total_leads,
        "estimated_leads": estimated_leads,
        "appointed_leads": appointed_leads,
        "conversion_rate": conversion_rate,
        "drivable_leads": drivable_leads,
        "non_drivable_leads": non_drivable_leads,
        "legacy_leads": legacy_leads,
        "total_garages": total_garages,
        "total_appointments": total_appointments,
        "webhook_failures": webhook_failures,
        "autobiz_configured": autobiz_ok,
        "hubspot_enabled": cfg.get("enable_hubspot", False),
        "webhook_enabled": cfg.get("enable_webhook", False),
        "webhook_appointment_enabled": cfg.get("enable_webhook_appointment", False),
    }

# ── Admin Garages CRUD ──

@api_router.get("/admin/garages")
async def admin_get_garages(request: Request):
    await require_admin(request)
    garages = await db.garages.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return {"garages": garages}

@api_router.post("/admin/garages")
async def admin_create_garage(g: GarageCreate, request: Request):
    await require_admin(request)
    garage_id = str(uuid.uuid4())
    doc = {"id": garage_id, **g.dict()}
    await db.garages.insert_one(doc)
    return {"id": garage_id, "created": True}

@api_router.put("/admin/garages/{garage_id}")
async def admin_update_garage(garage_id: str, g: GarageCreate, request: Request):
    await require_admin(request)
    result = await db.garages.update_one({"id": garage_id}, {"$set": g.dict()})
    if result.matched_count == 0:
        raise HTTPException(404, "Garage non trouve")
    return {"updated": True}

@api_router.delete("/admin/garages/{garage_id}")
async def admin_delete_garage(garage_id: str, request: Request):
    await require_admin(request)
    result = await db.garages.delete_one({"id": garage_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Garage non trouve")
    return {"deleted": True}

# ── Admin Appointment Config ──

@api_router.get("/admin/appointment-config")
async def admin_get_appointment_config(request: Request):
    await require_admin(request)
    config = await db.appointment_config.find_one({"key": "global"}, {"_id": 0})
    if not config:
        config = {"key": "global", "active_days": [1, 2, 3, 4, 5], "slots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"], "slot_duration": 60, "max_per_slot": 1, "disabled_dates": []}
    return config

@api_router.post("/admin/appointment-config")
async def admin_update_appointment_config(cfg: AppointmentConfigUpdate, request: Request):
    await require_admin(request)
    doc = {"key": "global", **cfg.dict()}
    await db.appointment_config.update_one({"key": "global"}, {"$set": doc}, upsert=True)
    return doc

@api_router.get("/admin/appointments")
async def admin_get_appointments(request: Request, limit: int = 100):
    await require_admin(request)
    appointments = await db.appointments.find({}, {"_id": 0}).sort("date", -1).limit(limit).to_list(limit)
    return {"appointments": appointments, "total": len(appointments)}

@api_router.post("/admin/test-autobiz")
async def admin_test_autobiz(request: Request):
    await require_admin(request)
    cfg = await autobiz_service._get_dynamic_config()
    if not cfg["configured"]:
        return {"success": False, "error": "Autobiz non configure (credentials ou base_url manquants)"}

    masked_user = cfg["username"][:5] + "***" if len(cfg["username"]) > 5 else "***"
    auth_url = f"{cfg['base_url']}/users/v1/auth"

    try:
        import httpx
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(auth_url, headers={"username": cfg["username"], "password": cfg["password"]})
            body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"raw": resp.text[:300]}
            return {
                "success": resp.status_code == 200,
                "auth_url": auth_url,
                "username": masked_user,
                "status_code": resp.status_code,
                "response_code": body.get("code", ""),
                "response_message": body.get("message", ""),
                "token_received": bool(body.get("accessToken") or body.get("access_token") or body.get("token")),
            }
    except Exception as e:
        return {"success": False, "auth_url": auth_url, "username": masked_user, "error": str(e)}

# ── HEALTH ──────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"status": "ok", "autobiz_configured": autobiz_service.is_configured()}

# ── SEO PAGES (public) ──────────────────────────────────────────────

@api_router.get("/seo-pages/{slug:path}")
async def get_seo_page(slug: str):
    """Public endpoint to load SEO page content by slug."""
    clean_slug = slug.strip("/") or "rachat-voiture"
    page = await db.seo_pages.find_one({"slug": clean_slug, "active": True}, {"_id": 0})
    if not page:
        raise HTTPException(404, "Page non trouvee")
    return page

@api_router.get("/seo-pages-list")
async def list_seo_pages():
    """List all active SEO pages (for sitemap / internal linking)."""
    pages = await db.seo_pages.find({"active": True}, {"_id": 0, "slug": 1, "type": 1, "city_name": 1, "department_name": 1, "seo_title": 1}).to_list(500)
    return {"pages": pages}

# ── SEO PAGES (admin) ───────────────────────────────────────────────

@api_router.get("/admin/seo-pages")
async def admin_list_seo_pages(request: Request):
    await require_admin(request)
    pages = await db.seo_pages.find({}, {"_id": 0}).sort("type", 1).to_list(500)
    return {"pages": pages}

@api_router.get("/admin/seo-pages/{page_id}")
async def admin_get_seo_page(page_id: str, request: Request):
    await require_admin(request)
    page = await db.seo_pages.find_one({"id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(404, "Page non trouvee")
    return page

@api_router.post("/admin/seo-pages")
async def admin_create_seo_page(request: Request):
    await require_admin(request)
    body = await request.json()
    body["id"] = str(uuid.uuid4())
    # Check slug uniqueness
    existing = await db.seo_pages.find_one({"slug": body.get("slug", "")})
    if existing:
        raise HTTPException(409, "Ce slug existe deja")
    await db.seo_pages.insert_one(body)
    return {"id": body["id"], "created": True}

@api_router.put("/admin/seo-pages/{page_id}")
async def admin_update_seo_page(page_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    body.pop("_id", None)
    body.pop("id", None)
    result = await db.seo_pages.update_one({"id": page_id}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(404, "Page non trouvee")
    return {"updated": True}

@api_router.delete("/admin/seo-pages/{page_id}")
async def admin_delete_seo_page(page_id: str, request: Request):
    await require_admin(request)
    result = await db.seo_pages.delete_one({"id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Page non trouvee")
    return {"deleted": True}

# ── SEO IMAGE UPLOAD ─────────────────────────────────────────────────

ALLOWED_IMAGE_TYPES = {"jpg", "jpeg", "png", "webp"}
MAX_SEO_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_IMAGE_WIDTH = 1200

def clean_filename(name: str) -> str:
    """Normalize filename for SEO-friendly URLs."""
    name = name.lower().strip()
    import unicodedata
    name = unicodedata.normalize('NFD', name)
    name = ''.join(c for c in name if unicodedata.category(c) != 'Mn')
    name = re.sub(r'[^a-z0-9]+', '-', name)
    name = name.strip('-')
    return name or 'image'

def process_image_to_webp(data: bytes, max_width: int = MAX_IMAGE_WIDTH) -> bytes:
    """Convert image to WebP, resize if needed, optimize."""
    img = PILImage.open(io.BytesIO(data))
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGBA')
    else:
        img = img.convert('RGB')
    if img.width > max_width:
        ratio = max_width / img.width
        new_h = int(img.height * ratio)
        img = img.resize((max_width, new_h), PILImage.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='WEBP', quality=80, optimize=True)
    return buf.getvalue()

@api_router.post("/admin/seo-upload")
async def seo_upload_image(request: Request, file: UploadFile = File(...), slug: str = Query(""), purpose: str = Query("hero")):
    """Upload and optimize an image for SEO pages."""
    await require_admin(request)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, f"Type non autorise: .{ext}. Acceptes: {', '.join(ALLOWED_IMAGE_TYPES)}")
    data = await file.read()
    if len(data) > MAX_SEO_IMAGE_SIZE:
        raise HTTPException(400, f"Image trop volumineuse (max {MAX_SEO_IMAGE_SIZE // (1024*1024)} Mo)")
    try:
        webp_data = process_image_to_webp(data)
    except Exception as e:
        raise HTTPException(400, f"Impossible de traiter l'image: {str(e)}")
    clean_slug = clean_filename(slug) if slug else "page"
    clean_purpose = clean_filename(purpose) if purpose else "img"
    unique_id = uuid.uuid4().hex[:8]
    filename = f"rachat-voiture-{clean_slug}-{clean_purpose}-{unique_id}.webp"
    storage_path = f"{APP_NAME}/seo/{filename}"
    result = put_object(storage_path, webp_data, "image/webp")
    file_id = str(uuid.uuid4())
    await db.files.insert_one({
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": "image/webp",
        "size": len(webp_data),
        "original_size": len(data),
        "purpose": f"seo-{clean_purpose}",
        "slug": slug,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    url = f"/api/files/{result['path']}"
    return {"url": url, "path": result["path"], "size": len(webp_data), "filename": filename}

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
    autobiz_service.set_db(db)
    hubspot_service.set_db(db)
    webhook_service.set_db(db)

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

    # Seed SEO pages if empty
    seo_count = await db.seo_pages.count_documents({})
    if seo_count == 0:
        from services.seo_seed import ALL_PAGES
        await db.seo_pages.insert_many(ALL_PAGES)
        logger.info(f"Seeded {len(ALL_PAGES)} SEO pages")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
