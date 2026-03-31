"""UTM parameter utility for tracking lead sources."""


def extract_utm(params: dict) -> dict:
    """Extract UTM parameters from a dict (query params)."""
    utm_keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]
    return {k: v for k, v in params.items() if k in utm_keys and v}
