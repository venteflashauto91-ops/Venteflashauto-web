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


async def _get_auth_token() -> Optional[str]:
    """Authenticate with Autobiz and return a session token."""
    if not is_configured():
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{AUTOBIZ_BASE_URL}/auth/login",
                json={"username": AUTOBIZ_USERNAME, "password": AUTOBIZ_PASSWORD},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("token") or data.get("access_token")
    except Exception as e:
        logger.error(f"Autobiz auth failed: {e}")
        return None


async def identify_vehicle(plate: str) -> dict:
    """
    Identify a vehicle by license plate via Autobiz API.
    Falls back to mock data if Autobiz is not configured.
    """
    clean_plate = plate.upper().replace("-", "").replace(" ", "")

    if is_configured():
        try:
            token = await _get_auth_token()
            if not token:
                raise Exception("Auth failed")
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"{AUTOBIZ_BASE_URL}/vehicle/identify",
                    params={"plate": clean_plate},
                    headers={"Authorization": f"Bearer {token}"},
                )
                resp.raise_for_status()
                data = resp.json()
                return {
                    "found": True,
                    "source": "autobiz",
                    "vehicle": _normalize_autobiz_vehicle(data),
                    "versions": _extract_versions(data),
                    "raw": data,
                }
        except Exception as e:
            logger.error(f"Autobiz identify failed: {e}")
            return {"found": False, "source": "autobiz", "error": str(e)}

    # Mock fallback
    return _mock_identify(clean_plate)


async def get_quotation(vehicle_data: dict, mileage: int) -> dict:
    """
    Get a price quotation from Autobiz.
    Real API: GET /quotation/v1/version/{version_id}/year/{year}/mileage/{mileage}/quotation
    Retry: up to MAX_RETRIES times with RETRY_DELAY seconds between attempts.
    Falls back to mock if not configured.
    """
    if is_configured():
        token = await _get_auth_token()
        if not token:
            logger.error("Autobiz auth failed for quotation")
            return {"source": "autobiz", "base_price": 0, "error": "Auth failed"}

        # Extract version ID (format: "id: name" → take before colon)
        version_raw = vehicle_data.get("version", "")
        version_id = version_raw.split(":")[0].strip() if ":" in str(version_raw) else str(version_raw).strip()
        year = int(vehicle_data.get("year", 0))

        if not version_id or not year:
            return {"source": "autobiz", "base_price": 0, "error": "Missing version_id or year"}

        # Build Autobiz quotation URL (matches legacy PHP endpoint)
        url = f"{AUTOBIZ_BASE_URL}/quotation/v1/version/{version_id}/year/{year}/mileage/{mileage}/quotation"

        # Retry logic (legacy: up to 5 attempts, 2s delay)
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.get(
                        url,
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        base_price = _extract_price_from_quotation(data)
                        return {
                            "source": "autobiz",
                            "base_price": base_price,
                            "market_value_type": AUTOBIZ_MARKET_VALUE,
                            "raw": data,
                        }
                    else:
                        logger.warning(f"Autobiz quotation attempt {attempt}/{MAX_RETRIES} returned {resp.status_code}")
            except Exception as e:
                logger.warning(f"Autobiz quotation attempt {attempt}/{MAX_RETRIES} failed: {e}")

            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY)

        return {"source": "autobiz", "base_price": 0, "error": "Max retries exceeded"}

    # Mock fallback
    return _mock_quotation(vehicle_data, mileage)


def _extract_price_from_quotation(data: dict) -> float:
    """
    Extract base_price from Autobiz quotation response.
    Legacy logic: data['_quotation'][AUTOBIZ_MARKET_VALUE]
    """
    if not isinstance(data, dict):
        return 0.0

    # Primary: legacy path _quotation[market_value_key]
    quotation = data.get("_quotation", {})
    if isinstance(quotation, dict):
        val = quotation.get(AUTOBIZ_MARKET_VALUE)
        if isinstance(val, (int, float)):
            return float(val)

    # Fallback: try direct keys
    for key in [AUTOBIZ_MARKET_VALUE, "price", "tradeIn", "b2cMarketValue", "value", "estimation"]:
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
