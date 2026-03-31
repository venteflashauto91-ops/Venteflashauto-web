"""
Pricing Service - Applies range-based discounts to Autobiz base prices.

Logic:
1. Get base_price from Autobiz quotation
2. Look up matching range in DB (start_value <= base_price <= end_value)
3. If range found → apply range_value as percentage adjustment
4. If no range → apply DEFAULT_DISCOUNT_PERCENT
5. Return final adjusted price
"""
import os
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

DEFAULT_DISCOUNT_PERCENT = float(os.environ.get("DEFAULT_DISCOUNT_PERCENT", "0"))


async def calculate_final_price(db: AsyncIOMotorDatabase, base_price: float) -> dict:
    """
    Calculate final price by applying range or default discount.
    Returns dict with base_price, discount_percent, adjustment, final_price, range_used.
    """
    if base_price <= 0:
        return {
            "base_price": 0,
            "discount_percent": 0,
            "adjustment": 0,
            "final_price": 0,
            "range_used": None,
        }

    # Find matching range
    matching_range = await db.ranges.find_one(
        {"start_value": {"$lte": base_price}, "end_value": {"$gte": base_price}},
        {"_id": 0},
    )

    if matching_range:
        discount = matching_range["range_value"]
        range_info = {
            "start_value": matching_range["start_value"],
            "end_value": matching_range["end_value"],
            "range_value": discount,
        }
    else:
        discount = DEFAULT_DISCOUNT_PERCENT
        range_info = None

    adjustment = base_price * discount / 100
    final_price = round(base_price + adjustment, -1)

    return {
        "base_price": base_price,
        "discount_percent": discount,
        "adjustment": round(adjustment, 2),
        "final_price": max(0, final_price),
        "range_used": range_info,
    }
