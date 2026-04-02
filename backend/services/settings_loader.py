"""
Dynamic settings loader for services.
Reads from MongoDB settings first, falls back to .env.
Caches settings for 60 seconds to avoid DB hits on every request.
"""
import os
import time
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

_cache = {}
_cache_ttl = 60  # seconds


async def get_setting(db: AsyncIOMotorDatabase, key: str, env_fallback: str = "") -> str:
    """Get a single setting value. DB first, then env fallback."""
    global _cache

    now = time.time()
    if _cache.get("_ts", 0) + _cache_ttl > now and key in _cache:
        return _cache[key]

    # Reload from DB
    doc = await db.settings.find_one({"key": "global"}, {"_id": 0})
    if doc:
        _cache = {**doc, "_ts": now}
        val = doc.get(key)
        if val is not None and val != "":
            return str(val) if not isinstance(val, bool) else val
    else:
        _cache["_ts"] = now

    # Fallback to env
    env_key = key.upper()
    return os.environ.get(env_key, env_fallback)


async def get_all_settings(db: AsyncIOMotorDatabase) -> dict:
    """Get all settings as dict. DB first, merged with env defaults."""
    global _cache
    now = time.time()

    if _cache.get("_ts", 0) + _cache_ttl > now and len(_cache) > 2:
        return {k: v for k, v in _cache.items() if k != "_ts"}

    doc = await db.settings.find_one({"key": "global"}, {"_id": 0}) or {}

    result = {
        "autobiz_base_url": doc.get("autobiz_base_url") or os.environ.get("AUTOBIZ_BASE_URL", ""),
        "autobiz_market_value": doc.get("autobiz_market_value") or os.environ.get("AUTOBIZ_MARKET_VALUE", "tradeIn"),
        "autobiz_username": doc.get("autobiz_username") or os.environ.get("AUTOBIZ_USERNAME", ""),
        "autobiz_password": doc.get("autobiz_password") or os.environ.get("AUTOBIZ_PASSWORD", ""),
        "default_discount_percent": doc.get("default_discount_percent") if doc.get("default_discount_percent") is not None else float(os.environ.get("DEFAULT_DISCOUNT_PERCENT", "0")),
        "enable_hubspot": doc.get("enable_hubspot") if doc.get("enable_hubspot") is not None else os.environ.get("ENABLE_HUBSPOT", "false").lower() == "true",
        "hubspot_api_key": doc.get("hubspot_api_key") or os.environ.get("HUBSPOT_API_KEY", ""),
        "enable_webhook": doc.get("enable_webhook") if doc.get("enable_webhook") is not None else os.environ.get("ENABLE_WEBHOOK", "false").lower() == "true",
        "webhook_url": doc.get("webhook_url") or os.environ.get("WEBHOOK_URL", ""),
        "enable_webhook_appointment": doc.get("enable_webhook_appointment") if doc.get("enable_webhook_appointment") is not None else os.environ.get("ENABLE_WEBHOOK_APPOINTMENT", "false").lower() == "true",
        "webhook_appointment_url": doc.get("webhook_appointment_url") or os.environ.get("WEBHOOK_APPOINTMENT_URL", ""),
    }

    _cache = {**result, "_ts": now}
    return result


def invalidate_cache():
    """Force reload on next access."""
    global _cache
    _cache = {}
