"""
Autobiz API Service - Backend Only
All Autobiz calls are made server-side. No credentials are ever exposed to the frontend.
"""
import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

AUTOBIZ_USERNAME = os.environ.get("AUTOBIZ_USERNAME", "")
AUTOBIZ_PASSWORD = os.environ.get("AUTOBIZ_PASSWORD", "")
AUTOBIZ_BASE_URL = os.environ.get("AUTOBIZ_BASE_URL", "")
AUTOBIZ_MARKET_VALUE = os.environ.get("AUTOBIZ_MARKET_VALUE", "tradeIn")

# ── Mock data (used when credentials are not configured) ─────────────

MOCK_VEHICLES = {
    "AA123BB": {"make": "Peugeot", "model": "208", "version": "1.2 PureTech 100 Active", "year": 2020, "fuel": "Essence", "body": "Berline", "doors": 5, "gearbox": "Manuelle", "power": 100, "engineSize": "1.2"},
    "CC456DD": {"make": "Renault", "model": "Clio V", "version": "1.0 TCe 100 Intens", "year": 2021, "fuel": "Essence", "body": "Berline", "doors": 5, "gearbox": "Manuelle", "power": 100, "engineSize": "1.0"},
    "EE789FF": {"make": "Citroen", "model": "C3", "version": "1.2 PureTech 83 Feel", "year": 2019, "fuel": "Essence", "body": "Berline", "doors": 5, "gearbox": "Manuelle", "power": 83, "engineSize": "1.2"},
    "GG012HH": {"make": "Volkswagen", "model": "Golf 8", "version": "1.5 TSI 150 Style", "year": 2022, "fuel": "Essence", "body": "Berline", "doors": 5, "gearbox": "Automatique", "power": 150, "engineSize": "1.5"},
    "KK345LL": {"make": "BMW", "model": "Serie 3", "version": "320d xDrive M Sport", "year": 2021, "fuel": "Diesel", "body": "Berline", "doors": 4, "gearbox": "Automatique", "power": 190, "engineSize": "2.0"},
    "MM678NN": {"make": "Mercedes", "model": "Classe A", "version": "A 200 AMG Line", "year": 2020, "fuel": "Essence", "body": "Berline", "doors": 5, "gearbox": "Automatique", "power": 163, "engineSize": "1.3"},
    "PP901QQ": {"make": "Audi", "model": "A3", "version": "35 TFSI S Line", "year": 2022, "fuel": "Essence", "body": "Berline", "doors": 5, "gearbox": "Automatique", "power": 150, "engineSize": "1.5"},
    "AB123CD": {"make": "Toyota", "model": "Yaris", "version": "1.5 Hybride Dynamic", "year": 2023, "fuel": "Hybride", "body": "Berline", "doors": 5, "gearbox": "Automatique", "power": 116, "engineSize": "1.5"},
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
    Falls back to mock if not configured.
    """
    if is_configured():
        try:
            token = await _get_auth_token()
            if not token:
                raise Exception("Auth failed")
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{AUTOBIZ_BASE_URL}/vehicle/quote",
                    json={
                        "vehicle": vehicle_data,
                        "mileage": mileage,
                        "marketValue": AUTOBIZ_MARKET_VALUE,
                    },
                    headers={"Authorization": f"Bearer {token}"},
                )
                resp.raise_for_status()
                data = resp.json()
                base_price = _extract_price(data)
                return {
                    "source": "autobiz",
                    "base_price": base_price,
                    "market_value_type": AUTOBIZ_MARKET_VALUE,
                    "raw": data,
                }
        except Exception as e:
            logger.error(f"Autobiz quotation failed: {e}")
            return {"source": "autobiz", "base_price": 0, "error": str(e)}

    # Mock fallback
    return _mock_quotation(vehicle_data, mileage)


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
    }


def _extract_price(data: dict) -> float:
    """Extract price from Autobiz quotation response."""
    if isinstance(data, dict):
        for key in ["price", "tradeIn", "value", "estimation", AUTOBIZ_MARKET_VALUE]:
            if key in data:
                val = data[key]
                if isinstance(val, (int, float)):
                    return float(val)
                if isinstance(val, dict) and "value" in val:
                    return float(val["value"])
    return 0.0


def _mock_identify(plate: str) -> dict:
    """Mock vehicle identification."""
    import random
    if plate in MOCK_VEHICLES:
        return {"found": True, "source": "mock", "vehicle": MOCK_VEHICLES[plate]}

    brands = [
        {"make": "Peugeot", "model": "308", "version": "1.5 BlueHDi 130 Allure", "power": 130, "engineSize": "1.5"},
        {"make": "Renault", "model": "Megane", "version": "1.3 TCe 140 Techno", "power": 140, "engineSize": "1.3"},
        {"make": "Citroen", "model": "C4", "version": "1.2 PureTech 130 Shine", "power": 130, "engineSize": "1.2"},
        {"make": "Dacia", "model": "Sandero", "version": "1.0 TCe 90 Stepway", "power": 90, "engineSize": "1.0"},
        {"make": "Fiat", "model": "500", "version": "1.0 Hybrid 70 Lounge", "power": 70, "engineSize": "1.0"},
    ]
    chosen = random.choice(brands)
    year = random.randint(2017, 2024)
    fuel = random.choice(["Essence", "Diesel", "Hybride"])
    gearbox = random.choice(["Manuelle", "Automatique"])
    return {
        "found": True,
        "source": "mock",
        "vehicle": {**chosen, "year": year, "fuel": fuel, "body": "Berline", "doors": 5, "gearbox": gearbox},
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
