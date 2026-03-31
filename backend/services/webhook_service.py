"""
Webhook Service.
Enable via ENABLE_WEBHOOK=true and set WEBHOOK_URL in .env.

Sends complete lead payload matching legacy PHP plugin structure,
including all vehicle data, contact info, pricing breakdown, and tracking fields.
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

ENABLE_WEBHOOK = os.environ.get("ENABLE_WEBHOOK", "false").lower() == "true"
WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "")


async def send_lead(lead_doc: dict) -> dict:
    """
    Send lead data to configured webhook URL.
    Payload matches legacy PHP plugin structure with all tracking fields.
    """
    if not ENABLE_WEBHOOK or not WEBHOOK_URL:
        logger.info("Webhook disabled or not configured, skipping")
        return {"sent": False, "reason": "disabled"}

    vehicle = lead_doc.get("vehicle", {})
    client_info = lead_doc.get("client", {})
    pricing = lead_doc.get("pricing", {})
    tracking = lead_doc.get("tracking", {})

    # Build legacy-compatible webhook payload
    payload = {
        "car_id": lead_doc.get("id", ""),
        "car_brand": vehicle.get("make", ""),
        "car_model": vehicle.get("model", ""),
        "car_month": vehicle.get("month", ""),
        "car_year": vehicle.get("year", ""),
        "car_fuel": vehicle.get("fuel", ""),
        "car_body": vehicle.get("body", ""),
        "car_doors": vehicle.get("doors", ""),
        "car_gearbox": vehicle.get("gearbox", ""),
        "car_horsepower": vehicle.get("power", ""),
        "car_engine": vehicle.get("engineSize", ""),
        "car_reg": vehicle.get("dateRelease", ""),
        "car_km": lead_doc.get("mileage", 0),
        "car_version": vehicle.get("version", ""),
        "car_imported": lead_doc.get("imported", False),
        "car_firstHand": lead_doc.get("first_owner", False),
        "car_maintenanceBooklet": lead_doc.get("service_book", False),
        "car_maintenanceInvoices": lead_doc.get("service_invoices", False),
        "car_drivable": "yes" if lead_doc.get("is_drivable") else "no",
        "reason": lead_doc.get("condition", ""),
        "car_reason_text": lead_doc.get("defects", ""),
        "email": client_info.get("email", ""),
        "postal_code": client_info.get("postal_code", ""),
        "phone": client_info.get("phone", ""),
        "request_date": lead_doc.get("created_at", ""),
        "immatriculation_number": lead_doc.get("plate", ""),
        "estimation": pricing.get("final_price", 0),
        "base_price": pricing.get("base_price", 0),
        "range_price": pricing.get("range_price"),
        "discount_price": pricing.get("discount_price"),
        # Tracking fields (UTM, Google Ads, browser info)
        "utm_source": tracking.get("utm_source", ""),
        "utm_medium": tracking.get("utm_medium", ""),
        "utm_campaign": tracking.get("utm_campaign", ""),
        "utm_term": tracking.get("utm_term", ""),
        "utm_content": tracking.get("utm_content", ""),
        "gclid": tracking.get("gclid", ""),
        "gbraid": tracking.get("gbraid", ""),
        "gad_source": tracking.get("gad_source", ""),
        "gad_campaignid": tracking.get("gad_campaignid", ""),
        "hsa_acc": tracking.get("hsa_acc", ""),
        "hsa_cam": tracking.get("hsa_cam", ""),
        "hsa_grp": tracking.get("hsa_grp", ""),
        "hsa_ad": tracking.get("hsa_ad", ""),
        "hsa_src": tracking.get("hsa_src", ""),
        "hsa_kw": tracking.get("hsa_kw", ""),
        "hsa_mt": tracking.get("hsa_mt", ""),
        "hsa_tgt": tracking.get("hsa_tgt", ""),
        "hsa_net": tracking.get("hsa_net", ""),
        "landing_page": tracking.get("landing_page", ""),
        "referrer": tracking.get("referrer", ""),
        "user_agent": tracking.get("user_agent", ""),
        "ip": tracking.get("ip", ""),
        "advertisment_data": tracking,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            logger.info(f"Webhook sent successfully: {resp.status_code}")
            return {"sent": True, "status_code": resp.status_code}
    except Exception as e:
        logger.error(f"Webhook send failed: {e}")
        return {"sent": False, "error": str(e)}
