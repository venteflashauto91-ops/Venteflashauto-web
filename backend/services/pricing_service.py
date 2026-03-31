"""
Pricing Service - Applies range-based discounts to Autobiz base prices.

Exact legacy logic (from PHP plugin):
1. Get base_price from Autobiz _quotation[car_market_value]
2. Check ranges table: if base_price BETWEEN start_value AND end_value
   → apply range_value as percentage: range_price = price + (price * range_value / 100)
3. If no matching range: apply DEFAULT_DISCOUNT_PERCENT
   → discount_price = price + (price * discount_percent / 100)
4. Return: base_price, range_price, discount_price, final price (rounded)

Note: range_value is typically negative (e.g., -15 means a 15% reduction).
Formula: price + (price * -15 / 100) = price * 0.85
"""
import os
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

DEFAULT_DISCOUNT_PERCENT = float(os.environ.get("DEFAULT_DISCOUNT_PERCENT", "0"))


async def calculate_final_price(db: AsyncIOMotorDatabase, base_price: float) -> dict:
    """
    Calculate final price by applying range or default discount.
    Returns dict matching legacy response: base_price, range_price, discount_price, final_price.
    """
    if base_price <= 0:
        return {
            "base_price": 0,
            "range_price": None,
            "discount_price": None,
            "final_price": 0,
            "discount_percent": 0,
            "range_used": None,
        }

    price = base_price
    range_price = None
    discount_price = None
    discount_percent = 0
    range_used = None

    # Find matching range: base_price BETWEEN start_value AND end_value
    matching_range = await db.ranges.find_one(
        {"start_value": {"$lte": base_price}, "end_value": {"$gte": base_price}},
        {"_id": 0},
    )

    if matching_range:
        # Legacy: $range_price = $price + ($price * $range_discount / 100)
        range_discount = float(matching_range["range_value"])
        range_price = price + (price * range_discount / 100)
        price = range_price
        discount_percent = range_discount
        range_used = {
            "start_value": matching_range["start_value"],
            "end_value": matching_range["end_value"],
            "range_value": range_discount,
        }
        logger.info(f"Range applied: base={base_price}, range_discount={range_discount}%, range_price={range_price}")
    else:
        # Legacy: $discount_price = $price + ($price * $discount_percentage / 100)
        if DEFAULT_DISCOUNT_PERCENT != 0:
            discount_price = price + (price * DEFAULT_DISCOUNT_PERCENT / 100)
            price = discount_price
            discount_percent = DEFAULT_DISCOUNT_PERCENT
            logger.info(f"Default discount applied: base={base_price}, discount={DEFAULT_DISCOUNT_PERCENT}%, discount_price={discount_price}")
        else:
            logger.info(f"No range or discount: base_price={base_price}")

    final_price = round(price)

    return {
        "base_price": base_price,
        "range_price": round(range_price) if range_price is not None else None,
        "discount_price": round(discount_price) if discount_price is not None else None,
        "final_price": max(0, final_price),
        "discount_percent": discount_percent,
        "range_used": range_used,
    }
