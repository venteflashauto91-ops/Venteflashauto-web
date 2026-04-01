"""
Autobiz API Service - Backend Only
All Autobiz calls are made server-side. No credentials are ever exposed to the frontend.

Real API: https://apiv2.autobiz.com
Quotation endpoint: /quotation/v1/version/{version_id}/year/{year}/mileage/{mileage}/quotation
Auth: Bearer token from /auth/login
"""
import os
import logging
import asyncio
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

AUTOBIZ_USERNAME = os.environ.get("AUTOBIZ_USERNAME", "")
AUTOBIZ_PASSWORD = os.environ.get("AUTOBIZ_PASSWORD", "")
AUTOBIZ_BASE_URL = os.environ.get("AUTOBIZ_BASE_URL", "")
AUTOBIZ_MARKET_VALUE = os.environ.get("AUTOBIZ_MARKET_VALUE", "tradeIn")

MAX_RETRIES = 5
RETRY_DELAY = 2

# Dynamic DB ref — set by server.py at startup
_db = None

def set_db(db):
    global _db
    _db = db

# ── Mock data (used when credentials are not configured) ─────────────

MOCK_VEHICLES = {
    "AA123BB": {"make": "Peugeot", "model": "208", "year": 2020, "fuel": "Essence", "body": "Berline", "doors": 5, "gearbox": "Manuelle", "power": 100, "engineSize": "1.2", "speedNumber": 5, "dateRelease": "2020-03-15", "km": 45000, "versions": [
        {"id": "208_1", "name": "1.2 PureTech 75 Like"},
        {"id": "208_2", "name": "1.2 PureTech 100 Active"},
        {"id": "208_3", "name": "1.2 PureTech 100 Allure"},
        {"id": "208_4", "name": "1.2 PureTech 130 GT"},
    ]},
    "CC456DD": {"make": "Renault", "model": "Clio V", "year": 2021, "fuel": "Essence", "body": "Berline", "doors": 5, "gearbox": "Manuelle", "power": 100, "engineSize": "1.0", "speedNumber": 5, "dateRelease": "2021-06-10", "km": 32000, "versions": [
        {"id": "clio_1", "name": "1.0 TCe 90 Zen"},
        {"id": "clio_2", "name": "1.0 TCe 100 Intens"},
        {"id": "clio_3", "name": "1.0 TCe 100 RS Line"},
    ]},
    "GG012HH": {"make": "Volkswagen", "model": "Golf 8", "year": 2022, "fuel": "Essence", "body": "Berline", "doors": 5, "gearbox": "Automatique", "power": 150, "engineSize": "1.5", "speedNumber": 7, "dateRelease": "2022-04-05", "km": 28000, "versions": [
        {"id": "golf_1", "name": "1.0 TSI 110 Life"},
        {"id": "golf_2", "name": "1.5 TSI 130 Style"},
        {"id": "golf_3", "name": "1.5 TSI 150 Style"},
    ]},
    "KK345LL": {"make": "BMW", "model": "Serie 3", "year": 2021, "fuel": "Diesel", "body": "Berline", "doors": 4, "gearbox": "Automatique", "power": 190, "engineSize": "2.0", "speedNumber": 8, "dateRelease": "2021-09-12", "km": 55000, "versions": [
        {"id": "s3_1", "name": "318d 150 Business Design"},
        {"id": "s3_2", "name": "320d 190 M Sport"},
    ]},
    "AB123CD": {"make": "Toyota", "model": "Yaris", "year": 2023, "fuel": "Hybride", "body": "Berline", "doors": 5, "gearbox": "Automatique", "power": 116, "engineSize": "1.5", "speedNumber": 0, "dateRelease": "2023-07-22", "km": 15000, "versions": [
        {"id": "y_1", "name": "1.5 Hybride 116 Dynamic"},
        {"id": "y_2", "name": "1.5 Hybride 116 Design"},
    ]},
}

MOCK_BASE_PRICES = {
    "Peugeot": 10500, "Renault": 9800, "Citroen": 9200, "Volkswagen": 15000,
    "BMW": 24000, "Mercedes": 25000, "Audi": 22000, "Toyota": 14000,
    "Dacia": 8500, "Fiat": 7500,
}


def is_configured() -> bool:
    return bool(AUTOBIZ_USERNAME and AUTOBIZ_PASSWORD and AUTOBIZ_BASE_URL)


async def _get_dynamic_config() -> dict:
    """Get Autobiz config from DB settings, fallback to env vars."""
    if _db is not None:
        from services.settings_loader import get_all_settings
        s = await get_all_settings(_db)
        username = s.get("autobiz_username") or AUTOBIZ_USERNAME
        password = s.get("autobiz_password") or AUTOBIZ_PASSWORD
        base_url = s.get("autobiz_base_url") or AUTOBIZ_BASE_URL
        market_value = s.get("autobiz_market_value") or AUTOBIZ_MARKET_VALUE
        return {"username": username, "password": password, "base_url": base_url, "market_value": market_value, "configured": bool(username and password and base_url)}
    return {"username": AUTOBIZ_USERNAME, "password": AUTOBIZ_PASSWORD, "base_url": AUTOBIZ_BASE_URL, "market_value": AUTOBIZ_MARKET_VALUE, "configured": is_configured()}


async def _get_auth_token() -> Optional[str]:
    """
    Authenticate with Autobiz API.
    Endpoint: POST {base_url}/users/v1/auth
    Credentials sent as request headers (username/password).
    Response expected: { accessToken: "..." }
    """
    cfg = await _get_dynamic_config()
    if not cfg["configured"]:
        logger.warning("Autobiz not configured — missing credentials or base_url")
        return None

    auth_url = f"{cfg['base_url']}/users/v1/auth"
    masked_user = cfg["username"][:5] + "***" if len(cfg["username"]) > 5 else "***"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Send credentials in headers as per Autobiz API spec
            resp = await client.post(
                auth_url,
                headers={
                    "username": cfg["username"],
                    "password": cfg["password"],
                },
            )

            logger.info(f"Autobiz auth: URL={auth_url} | user={masked_user} | status={resp.status_code}")

            if resp.status_code != 200:
                body_text = resp.text[:1000]
                logger.error(f"Autobiz auth rejected: status={resp.status_code}")
                logger.error(f"Autobiz auth response body: {body_text}")
                return None

            data = resp.json()

            # Autobiz returns accessToken (camelCase)
            token = data.get("accessToken") or data.get("access_token") or data.get("token")
            if token:
                logger.info(f"Autobiz auth success: token={token[:10]}...")
                return token
            else:
                logger.error(f"Autobiz auth: no token in response. Keys: {list(data.keys())}")
                return None

    except Exception as e:
        logger.error(f"Autobiz auth exception: {e}")
        return None


async def identify_vehicle(plate: str) -> dict:
    """
    Identify a vehicle by license plate.
    NOTE: Autobiz API does NOT have a plate identification endpoint.
    In the legacy site, identification was done client-side by the Autobiz widget (cap-script.js).
    Our backend uses mock data for identification. Real Autobiz integration is only for quotation.
    A future integration with a SIV (Systeme d'Immatriculation des Vehicules) API could replace this.
    """
    clean_plate = plate.upper().replace("-", "").replace(" ", "")
    return _mock_identify(clean_plate)


async def get_quotation(vehicle_data: dict, mileage: int) -> dict:
    """Get price quotation from Autobiz with retry. Falls back to mock."""
    cfg = await _get_dynamic_config()
    if cfg["configured"]:
        token = await _get_auth_token()
        if not token:
            logger.warning("Autobiz auth failed for quotation, falling back to mock")
            return _mock_quotation(vehicle_data, mileage)

        version_raw = vehicle_data.get("version", "")
        version_id = version_raw.split(":")[0].strip() if ":" in str(version_raw) else str(version_raw).strip()
        year = int(vehicle_data.get("year", 0))

        if not version_id or not year:
            return {"source": "autobiz", "base_price": 0, "error": "Missing version_id or year"}

        url = f"{cfg['base_url']}/quotation/v1/version/{version_id}/year/{year}/mileage/{mileage}/quotation"
        market_value = cfg["market_value"]
        logger.info(f"Autobiz quotation: URL={url} | market_value={market_value}")

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
                    if resp.status_code == 200:
                        data = resp.json()
                        base_price = _extract_price_from_quotation(data, market_value)
                        logger.info(f"Autobiz quotation success: base_price={base_price} (market_value={market_value})")
                        return {"source": "autobiz", "base_price": base_price, "market_value_type": market_value, "raw": data}
                    else:
                        logger.warning(f"Autobiz quotation attempt {attempt}/{MAX_RETRIES} returned {resp.status_code}")
            except Exception as e:
                logger.warning(f"Autobiz quotation attempt {attempt}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY)

        return {"source": "autobiz", "base_price": 0, "error": "Max retries exceeded"}

    return _mock_quotation(vehicle_data, mileage)


def _extract_price_from_quotation(data: dict, market_value: str = None) -> float:
    """Extract base_price from Autobiz quotation response."""
    mv = market_value or AUTOBIZ_MARKET_VALUE
    if not isinstance(data, dict):
        return 0.0
    quotation = data.get("_quotation", {})
    if isinstance(quotation, dict):
        val = quotation.get(mv)
        if isinstance(val, (int, float)):
            return float(val)
    for key in [mv, "price", "tradeIn", "b2cMarketValue", "value", "estimation"]:
        if key in data:
            val = data[key]
            if isinstance(val, (int, float)):
                return float(val)
            if isinstance(val, dict) and "value" in val:
                return float(val["value"])
    return 0.0


def _extract_versions(data: dict) -> list:
    """Extract version list from Autobiz identify response."""
    versions = data.get("versions", [])
    if isinstance(versions, list):
        return [{"id": str(v.get("id", "")), "name": v.get("name", v.get("label", ""))} for v in versions]
    return []


def _normalize_autobiz_vehicle(data: dict) -> dict:
    """Normalize Autobiz API response to our internal format."""
    return {
        "make": data.get("make", data.get("marque", "")),
        "model": data.get("model", data.get("modele", "")),
        "version": data.get("version", ""),
        "year": data.get("year", data.get("annee", 0)),
        "fuel": data.get("fuel", data.get("carburant", "")),
        "body": data.get("body", data.get("carrosserie", "")),
        "doors": data.get("doors", data.get("portes", 5)),
        "gearbox": data.get("gearbox", data.get("boite", "")),
        "power": data.get("power", data.get("puissance", 0)),
        "engineSize": data.get("engineSize", data.get("cylindree", "")),
        "dateRelease": data.get("dateRelease", ""),
        "km": data.get("km", 0),
    }


# ── Mock implementations ─────────────────────────────────────────────

def _mock_identify(plate: str) -> dict:
    """Mock vehicle identification with versions."""
    import random
    if plate in MOCK_VEHICLES:
        v = MOCK_VEHICLES[plate]
        return {"found": True, "source": "mock", "vehicle": {k: v2 for k, v2 in v.items() if k != "versions"}, "versions": v.get("versions", [])}

    brands = [
        {"make": "Peugeot", "model": "308", "power": 130, "engineSize": "1.5", "versions": [
            {"id": "308_1", "name": "1.2 PureTech 110 Active"},
            {"id": "308_2", "name": "1.5 BlueHDi 130 Allure"},
            {"id": "308_3", "name": "1.2 PureTech 130 GT"},
        ]},
        {"make": "Renault", "model": "Megane", "power": 140, "engineSize": "1.3", "versions": [
            {"id": "meg_1", "name": "1.3 TCe 140 Techno"},
            {"id": "meg_2", "name": "1.5 Blue dCi 115 Business"},
        ]},
        {"make": "Citroen", "model": "C4", "power": 130, "engineSize": "1.2", "versions": [
            {"id": "c4_1", "name": "1.2 PureTech 130 Shine"},
            {"id": "c4_2", "name": "1.5 BlueHDi 130 Feel"},
        ]},
        {"make": "Dacia", "model": "Sandero", "power": 90, "engineSize": "1.0", "versions": [
            {"id": "sand_1", "name": "1.0 TCe 90 Stepway Expression"},
            {"id": "sand_2", "name": "1.0 TCe 90 Stepway Extreme"},
        ]},
    ]
    chosen = random.choice(brands)
    versions = chosen.pop("versions")
    year = random.randint(2017, 2024)
    month = random.randint(1, 12)
    fuel = random.choice(["Essence", "Diesel", "Hybride"])
    gearbox = random.choice(["Manuelle", "Automatique"])
    km = random.randint(15000, 150000)
    speedNumber = 5 if gearbox == "Manuelle" else 7
    return {
        "found": True,
        "source": "mock",
        "vehicle": {**chosen, "year": year, "fuel": fuel, "body": "Berline", "doors": 5, "gearbox": gearbox, "speedNumber": speedNumber, "dateRelease": f"{year}-{month:02d}-15", "km": km},
        "versions": versions,
    }


def _mock_quotation(vehicle_data: dict, mileage: int) -> dict:
    """Mock quotation based on vehicle data."""
    import random
    make = vehicle_data.get("make", "")
    base = MOCK_BASE_PRICES.get(make, 11000)
    year = vehicle_data.get("year", 2020)
    age_factor = max(0.35, 1 - (2026 - year) * 0.08)
    km_factor = max(0.5, 1 - (mileage / 300000))
    price = base * age_factor * km_factor + random.randint(-300, 800)
    return {
        "source": "mock",
        "base_price": round(price, -1),
        "market_value_type": AUTOBIZ_MARKET_VALUE,
    }
