"""
HubSpot Integration Service (stub).
Enable via ENABLE_HUBSPOT=true and set HUBSPOT_API_KEY in .env.
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

ENABLE_HUBSPOT = os.environ.get("ENABLE_HUBSPOT", "false").lower() == "true"
HUBSPOT_API_KEY = os.environ.get("HUBSPOT_API_KEY", "")


async def create_contact(lead_data: dict) -> dict:
    """Create or update a HubSpot contact from lead data."""
    if not ENABLE_HUBSPOT or not HUBSPOT_API_KEY:
        logger.info("HubSpot disabled or not configured, skipping")
        return {"sent": False, "reason": "disabled"}

    try:
        client_info = lead_data.get("client", {})
        vehicle_info = lead_data.get("vehicle", {})
        properties = {
            "email": client_info.get("email", ""),
            "firstname": client_info.get("firstname", ""),
            "lastname": client_info.get("lastname", ""),
            "phone": client_info.get("phone", ""),
            "zip": client_info.get("postal_code", ""),
            "car_make": vehicle_info.get("make", ""),
            "car_model": vehicle_info.get("model", ""),
            "car_year": str(vehicle_info.get("year", "")),
            "car_plate": vehicle_info.get("plate", ""),
            "estimation_price": str(lead_data.get("final_price", "")),
        }

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.hubapi.com/crm/v3/objects/contacts",
                json={"properties": properties},
                headers={
                    "Authorization": f"Bearer {HUBSPOT_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            return {"sent": True, "hubspot_id": resp.json().get("id")}
    except Exception as e:
        logger.error(f"HubSpot create contact failed: {e}")
        return {"sent": False, "error": str(e)}
