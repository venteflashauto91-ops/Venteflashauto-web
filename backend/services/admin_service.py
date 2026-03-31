"""
Admin authentication and settings management.
- Admin password stored ONLY in backend .env (ADMIN_PASSWORD)
- JWT token issued on successful login (24h expiry)
- Secrets stored in MongoDB with masking for frontend display
- Services read settings from DB first, fallback to .env
"""
import os
import jwt
import bcrypt
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

JWT_SECRET = None
JWT_EXPIRY_HOURS = 24


def _get_jwt_secret():
    global JWT_SECRET
    if JWT_SECRET is None:
        JWT_SECRET = os.environ.get("JWT_SECRET", os.environ.get("EMERGENT_LLM_KEY", "fallback-secret-key"))
    return JWT_SECRET


def _get_admin_password():
    return os.environ.get("ADMIN_PASSWORD", "")


def verify_admin_password(password: str) -> bool:
    """Verify the admin password against the .env value."""
    admin_pw = _get_admin_password()
    if not admin_pw:
        return False
    return password == admin_pw


def create_token() -> str:
    """Create a JWT token for admin access."""
    payload = {
        "role": "admin",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, _get_jwt_secret(), algorithm="HS256")


def verify_token(token: str) -> bool:
    """Verify a JWT token."""
    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=["HS256"])
        return payload.get("role") == "admin"
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return False


# Fields that are secrets — never returned in full to frontend
SECRET_FIELDS = {"autobiz_username", "autobiz_password", "hubspot_api_key"}

# Default settings structure
DEFAULT_SETTINGS = {
    "key": "global",
    "autobiz_base_url": "",
    "autobiz_market_value": "tradeIn",
    "autobiz_username": "",
    "autobiz_password": "",
    "default_discount_percent": 0,
    "enable_hubspot": False,
    "hubspot_api_key": "",
    "enable_webhook": False,
    "webhook_url": "",
}


def mask_secret(value: str) -> str:
    """Mask a secret value for display. Shows first 3 chars + dots."""
    if not value:
        return ""
    if len(value) <= 4:
        return "*" * len(value)
    return value[:3] + "*" * (len(value) - 3)


async def get_settings(db: AsyncIOMotorDatabase, mask_secrets: bool = True) -> dict:
    """Load settings from MongoDB. If not found, return defaults merged with .env."""
    doc = await db.settings.find_one({"key": "global"}, {"_id": 0})

    if not doc:
        # Initialize from .env defaults
        doc = {**DEFAULT_SETTINGS}
        doc["autobiz_base_url"] = os.environ.get("AUTOBIZ_BASE_URL", "")
        doc["autobiz_market_value"] = os.environ.get("AUTOBIZ_MARKET_VALUE", "tradeIn")
        doc["autobiz_username"] = os.environ.get("AUTOBIZ_USERNAME", "")
        doc["autobiz_password"] = os.environ.get("AUTOBIZ_PASSWORD", "")
        doc["default_discount_percent"] = float(os.environ.get("DEFAULT_DISCOUNT_PERCENT", "0"))
        doc["enable_hubspot"] = os.environ.get("ENABLE_HUBSPOT", "false").lower() == "true"
        doc["hubspot_api_key"] = os.environ.get("HUBSPOT_API_KEY", "")
        doc["enable_webhook"] = os.environ.get("ENABLE_WEBHOOK", "false").lower() == "true"
        doc["webhook_url"] = os.environ.get("WEBHOOK_URL", "")

    result = {**doc}
    if mask_secrets:
        for field in SECRET_FIELDS:
            if field in result and result[field]:
                result[field] = mask_secret(result[field])

    return result


async def update_settings(db: AsyncIOMotorDatabase, updates: dict) -> dict:
    """
    Update settings in MongoDB.
    If a secret field value is all '*' or matches the masked pattern, skip it (no overwrite).
    """
    current = await db.settings.find_one({"key": "global"}, {"_id": 0})
    if not current:
        current = {**DEFAULT_SETTINGS}

    # Merge updates, but skip masked secret values
    for key, value in updates.items():
        if key == "key":
            continue
        if key in SECRET_FIELDS:
            # Skip if the value looks masked (all * or starts with known prefix + *)
            if not value or set(value) == {"*"} or (len(value) > 3 and value[3:] == "*" * (len(value) - 3)):
                continue
        current[key] = value

    current["key"] = "global"
    current["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.settings.update_one(
        {"key": "global"},
        {"$set": current},
        upsert=True,
    )

    return await get_settings(db, mask_secrets=True)


async def get_raw_settings(db: AsyncIOMotorDatabase) -> dict:
    """Get settings without masking — for internal service use only."""
    return await get_settings(db, mask_secrets=False)
