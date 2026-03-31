"""
Webhook Service (stub).
Enable via ENABLE_WEBHOOK=true and set WEBHOOK_URL in .env.
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

ENABLE_WEBHOOK = os.environ.get("ENABLE_WEBHOOK", "false").lower() == "true"
WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "")


async def send_lead(lead_data: dict) -> dict:
    """Send lead data to configured webhook URL."""
    if not ENABLE_WEBHOOK or not WEBHOOK_URL:
        logger.info("Webhook disabled or not configured, skipping")
        return {"sent": False, "reason": "disabled"}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                WEBHOOK_URL,
                json=lead_data,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            return {"sent": True, "status_code": resp.status_code}
    except Exception as e:
        logger.error(f"Webhook send failed: {e}")
        return {"sent": False, "error": str(e)}
