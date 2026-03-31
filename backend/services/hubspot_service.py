"""
HubSpot Integration Service.
Enable via ENABLE_HUBSPOT=true and set HUBSPOT_API_KEY in .env.

Legacy logic:
1. Create or update contact (email + phone)
2. If contact already exists, extract existing contact ID
3. Create deal with vf_* properties
4. Associate deal with contact
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

ENABLE_HUBSPOT = os.environ.get("ENABLE_HUBSPOT", "false").lower() == "true"
HUBSPOT_API_KEY = os.environ.get("HUBSPOT_API_KEY", "")
HUBSPOT_API_URL = "https://api.hubapi.com/crm/v3/objects"

_db = None

def set_db(db):
    global _db
    _db = db


async def _get_config():
    if _db is not None:
        from services.settings_loader import get_all_settings
        s = await get_all_settings(_db)
        return s.get("enable_hubspot", ENABLE_HUBSPOT), s.get("hubspot_api_key") or HUBSPOT_API_KEY
    return ENABLE_HUBSPOT, HUBSPOT_API_KEY


def _headers():
    return {
        "Authorization": f"Bearer {HUBSPOT_API_KEY}",
        "Content-Type": "application/json",
    }


def _headers_with_key(api_key: str):
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


async def create_contact_and_deal(lead_data: dict) -> dict:
    """
    Create HubSpot contact + deal from lead data (matches legacy PHP plugin).
    Returns: { sent, contact_id, deal_id, errors }
    """
    if not ENABLE_HUBSPOT or not HUBSPOT_API_KEY:
        # Check dynamic config from DB
        enabled, api_key = await _get_config()
        if not enabled or not api_key:
            logger.info("HubSpot disabled or not configured, skipping")
            return {"sent": False, "reason": "disabled"}
    else:
        _, api_key = await _get_config()
        if not api_key:
            api_key = HUBSPOT_API_KEY

    result = {"sent": False, "contact_id": None, "deal_id": None, "errors": []}

    client_info = lead_data.get("client", {})
    vehicle = lead_data.get("vehicle", {})
    inserted_id = lead_data.get("id", "")
    price = lead_data.get("price", 0)
    plate = lead_data.get("plate", "")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # ── Step 1: Create or find contact ──
            contact_id = await _create_or_find_contact(client, client_info, result)

            # ── Step 2: Create deal with vf_* properties ──
            deal_properties = {
                "vf_id": str(inserted_id),
                "vf_brand": vehicle.get("make", ""),
                "vf_model": vehicle.get("model", ""),
                "vf_version": vehicle.get("version", ""),
                "vf_year": str(vehicle.get("year", "")),
                "vf_fuel": vehicle.get("fuel", ""),
                "vf_body": vehicle.get("body", ""),
                "vf_doors": str(vehicle.get("doors", "")),
                "vf_gearbox": vehicle.get("gearbox", ""),
                "vf_horsepower": str(vehicle.get("power", "")),
                "vf_engine": str(vehicle.get("engineSize", "")),
                "vf_reg": vehicle.get("dateRelease", ""),
                "vf_km": str(lead_data.get("mileage", "")),
                "vf_imported": str(vehicle.get("imported", "")),
                "vf_first_hand": str(lead_data.get("first_owner", "")),
                "vf_maintenance_booklet": str(lead_data.get("service_book", "")),
                "vf_maintenance_invoices": str(lead_data.get("service_invoices", "")),
                "vf_drivable": "yes" if lead_data.get("is_drivable") else "no",
                "vf_reason": lead_data.get("condition", ""),
                "vf_reason_text": lead_data.get("defects", ""),
                "vf_immatriculation": plate,
                "vf_estimation": round(price),
                "vf_email": client_info.get("email", ""),
                "vf_cp": client_info.get("postal_code", ""),
                "vf_phone": client_info.get("phone", ""),
                "dealname": f"{inserted_id}|{plate}|{vehicle.get('make', '')}|{vehicle.get('model', '')}|{vehicle.get('year', '')}|{vehicle.get('fuel', '')}|{vehicle.get('body', '')}|{vehicle.get('gearbox', '')}|{lead_data.get('mileage', '')}",
                "dealstage": "appointmentscheduled",
                "amount": round(price),
            }

            deal_payload = {"properties": deal_properties}

            # Associate deal with contact if we have a contact_id
            if contact_id:
                deal_payload["associations"] = [{
                    "to": {"id": contact_id},
                    "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 3}],
                }]

            resp = await client.post(
                f"{HUBSPOT_API_URL}/deals",
                json=deal_payload,
                headers=_headers_with_key(api_key),
            )

            if resp.status_code == 201:
                deal_data = resp.json()
                result["deal_id"] = deal_data.get("id")
                result["sent"] = True
                logger.info(f"HubSpot deal created: {result['deal_id']}")
            else:
                error_msg = f"Deal creation failed: {resp.status_code} - {resp.text}"
                logger.error(error_msg)
                result["errors"].append(error_msg)

    except Exception as e:
        logger.error(f"HubSpot integration error: {e}")
        result["errors"].append(str(e))

    return result


async def _create_or_find_contact(client: httpx.AsyncClient, client_info: dict, result: dict) -> str:
    """Create a HubSpot contact or find existing one. Returns contact_id or None."""
    _, api_key = await _get_config()
    contact_payload = {
        "properties": {
            "email": client_info.get("email", ""),
            "phone": client_info.get("phone", ""),
        }
    }

    try:
        resp = await client.post(
            f"{HUBSPOT_API_URL}/contacts",
            json=contact_payload,
            headers=_headers_with_key(api_key),
        )

        if resp.status_code == 201:
            contact_data = resp.json()
            contact_id = contact_data.get("id")
            result["contact_id"] = contact_id
            logger.info(f"HubSpot contact created: {contact_id}")
            return contact_id

        # Contact already exists — extract existing ID from error response
        resp_data = resp.json()
        message = resp_data.get("message", "")
        if "already exists" in message.lower():
            # HubSpot returns existing ID in the error message
            existing_id = resp_data.get("id")
            if not existing_id:
                # Try to extract from message pattern
                import re
                match = re.search(r"Existing ID:\s*(\d+)", message)
                if match:
                    existing_id = match.group(1)
            if existing_id:
                result["contact_id"] = str(existing_id)
                logger.info(f"HubSpot contact already exists: {existing_id}")
                return str(existing_id)

        logger.warning(f"HubSpot contact creation: {resp.status_code} - {resp.text}")
    except Exception as e:
        logger.error(f"HubSpot contact error: {e}")
        result["errors"].append(f"Contact: {e}")

    return None
