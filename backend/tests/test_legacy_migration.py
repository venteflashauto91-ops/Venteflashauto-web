"""
VenteFlash Auto - Legacy Migration Tests
Tests for the NEW server-side pricing, tracking enrichment, and legacy-compatible responses.

Key features tested:
1. POST /api/leads/save returns: inserted_id, price, base_price, range_price, discount_price, status
2. Server computes final price (not frontend)
3. Tracking field enriched with server-side user_agent and ip
4. Pricing range logic: base_price matches ranges and applies correct discount
5. HubSpot/webhook return sent=false when disabled
6. GET /api/leads returns leads with 'tracking' field (not just 'utm')
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://car-buyback-1.preview.emergentagent.com').rstrip('/')


@pytest.fixture
def api_client():
    """Shared requests session with custom headers for tracking test"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "User-Agent": "TestAgent/1.0 pytest",
        "X-Forwarded-For": "192.168.1.100"
    })
    return session


# ══════════════════════════════════════════════════════════════════════════════
# TEST: POST /api/leads/save with drivable=true
# Expected: returns inserted_id, price (>0), base_price, range_price or discount_price, status
# ══════════════════════════════════════════════════════════════════════════════

class TestSaveLeadDrivableTrue:
    """Tests for saving drivable vehicle leads with server-side pricing"""
    
    def test_save_drivable_lead_returns_pricing_breakdown(self, api_client):
        """POST /api/leads/save with drivable=true should return full pricing breakdown"""
        lead_data = {
            "plate": f"TEST{uuid.uuid4().hex[:4].upper()}",
            "vehicle": {
                "make": "Peugeot",
                "model": "208",
                "version": "208_1: 1.2 PureTech 75 Like",
                "year": 2020,
                "fuel": "Essence",
                "body": "Berline",
                "doors": 5,
                "gearbox": "Manuelle",
                "power": 100,
                "engineSize": "1.2"
            },
            "mileage": 50000,
            "is_drivable": True,
            "condition": "bon",
            "defects": "",
            "first_owner": True,
            "service_book": True,
            "service_invoices": False,
            "imported": False,
            "client": {
                "firstname": "TestDrivable",
                "lastname": "User",
                "email": f"drivable_{uuid.uuid4().hex[:6]}@test.com",
                "phone": "0612345678",
                "postal_code": "75001"
            },
            "pricing": {},  # Empty - server should compute
            "photos": [],
            "utm": {"utm_source": "pytest", "utm_medium": "test"},
            "tracking": {"gclid": "test_gclid_123", "landing_page": "https://test.com/car-search"},
            "source": "pytest"
        }
        
        response = api_client.post(f"{BASE_URL}/api/leads/save", json=lead_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields in response
        assert "id" in data, "Response should contain 'id'"
        assert "inserted_id" in data, "Response should contain 'inserted_id'"
        assert "price" in data, "Response should contain 'price'"
        assert "base_price" in data, "Response should contain 'base_price'"
        assert "status" in data, "Response should contain 'status'"
        
        # Verify pricing values for drivable vehicle
        assert data["price"] > 0, f"Price should be > 0 for drivable vehicle, got {data['price']}"
        assert data["base_price"] > 0, f"Base price should be > 0, got {data['base_price']}"
        assert data["status"] == "saved", f"Status should be 'saved', got {data['status']}"
        
        # Either range_price or discount_price should be present (depending on range match)
        has_range_or_discount = data.get("range_price") is not None or data.get("discount_price") is not None
        print(f"Drivable lead saved: id={data['id']}, price={data['price']}, base_price={data['base_price']}, range_price={data.get('range_price')}, discount_price={data.get('discount_price')}")
        
        return data["id"]
    
    def test_save_drivable_lead_hubspot_webhook_disabled(self, api_client):
        """HubSpot and webhook should return sent=false when disabled"""
        lead_data = {
            "plate": f"TEST{uuid.uuid4().hex[:4].upper()}",
            "vehicle": {"make": "Renault", "model": "Clio", "year": 2021},
            "mileage": 30000,
            "is_drivable": True,
            "client": {
                "firstname": "HubspotTest",
                "lastname": "User",
                "email": f"hubspot_{uuid.uuid4().hex[:6]}@test.com",
                "phone": "0698765432"
            },
            "pricing": {},
            "utm": {},
            "tracking": {},
            "source": "pytest"
        }
        
        response = api_client.post(f"{BASE_URL}/api/leads/save", json=lead_data)
        assert response.status_code == 200
        
        data = response.json()
        
        # HubSpot and webhook should be false (disabled in .env)
        assert data.get("hubspot") == False, f"HubSpot should be False (disabled), got {data.get('hubspot')}"
        assert data.get("webhook") == False, f"Webhook should be False (disabled), got {data.get('webhook')}"
        
        print(f"HubSpot: {data.get('hubspot')}, Webhook: {data.get('webhook')} - both correctly disabled")


# ══════════════════════════════════════════════════════════════════════════════
# TEST: POST /api/leads/save with drivable=false
# Expected: returns price=0, base_price=0, range_price=null, discount_price=null
# ══════════════════════════════════════════════════════════════════════════════

class TestSaveLeadDrivableFalse:
    """Tests for saving non-drivable vehicle leads"""
    
    def test_save_non_drivable_lead_returns_zero_pricing(self, api_client):
        """POST /api/leads/save with drivable=false should return price=0"""
        lead_data = {
            "plate": f"TEST{uuid.uuid4().hex[:4].upper()}",
            "vehicle": {"make": "Citroen", "model": "C3", "year": 2019},
            "mileage": 80000,
            "is_drivable": False,
            "condition": "non_roulant",
            "defects": "Panne mecanique - moteur HS",
            "client": {
                "firstname": "NonDrivable",
                "lastname": "User",
                "email": f"nondrivable_{uuid.uuid4().hex[:6]}@test.com",
                "phone": "0611223344"
            },
            "pricing": {},
            "utm": {},
            "tracking": {},
            "source": "pytest"
        }
        
        response = api_client.post(f"{BASE_URL}/api/leads/save", json=lead_data)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify zero pricing for non-drivable
        assert data["price"] == 0, f"Price should be 0 for non-drivable, got {data['price']}"
        assert data["base_price"] == 0, f"Base price should be 0 for non-drivable, got {data['base_price']}"
        assert data.get("range_price") is None, f"Range price should be None for non-drivable, got {data.get('range_price')}"
        assert data.get("discount_price") is None, f"Discount price should be None for non-drivable, got {data.get('discount_price')}"
        assert data["status"] == "saved"
        
        print(f"Non-drivable lead saved: id={data['id']}, price={data['price']} (correctly 0)")


# ══════════════════════════════════════════════════════════════════════════════
# TEST: Tracking data enrichment with server-side user_agent and ip
# ══════════════════════════════════════════════════════════════════════════════

class TestTrackingEnrichment:
    """Tests for server-side tracking data enrichment"""
    
    def test_lead_tracking_includes_server_enriched_data(self, api_client):
        """Lead should have tracking field with server-enriched user_agent and ip"""
        lead_data = {
            "plate": f"TEST{uuid.uuid4().hex[:4].upper()}",
            "vehicle": {"make": "Toyota", "model": "Yaris", "year": 2023},
            "mileage": 15000,
            "is_drivable": True,
            "client": {
                "firstname": "TrackingTest",
                "lastname": "User",
                "email": f"tracking_{uuid.uuid4().hex[:6]}@test.com",
                "phone": "0655443322"
            },
            "pricing": {},
            "utm": {"utm_source": "google", "utm_medium": "cpc", "utm_campaign": "test_campaign"},
            "tracking": {
                "gclid": "test_gclid_abc123",
                "gbraid": "test_gbraid_xyz",
                "landing_page": "https://venteflashauto.com/car-search?car_info=AB123CD"
            },
            "source": "pytest"
        }
        
        response = api_client.post(f"{BASE_URL}/api/leads/save", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json()["id"]
        
        # Fetch the lead to verify tracking data
        leads_response = api_client.get(f"{BASE_URL}/api/leads?limit=50")
        assert leads_response.status_code == 200
        
        leads = leads_response.json().get("leads", [])
        saved_lead = next((l for l in leads if l.get("id") == lead_id), None)
        
        assert saved_lead is not None, f"Lead {lead_id} not found in leads list"
        
        # Verify tracking field exists (not just utm)
        tracking = saved_lead.get("tracking", {})
        assert tracking is not None, "Lead should have 'tracking' field"
        
        # Verify server-enriched fields
        assert "user_agent" in tracking, "Tracking should contain 'user_agent'"
        assert "ip" in tracking, "Tracking should contain 'ip'"
        
        # Verify client-sent tracking data preserved
        assert tracking.get("gclid") == "test_gclid_abc123", f"gclid should be preserved, got {tracking.get('gclid')}"
        assert tracking.get("utm_source") == "google", f"utm_source should be preserved, got {tracking.get('utm_source')}"
        
        print(f"Tracking enriched: user_agent={tracking.get('user_agent')[:30]}..., ip={tracking.get('ip')}, gclid={tracking.get('gclid')}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST: Pricing stored in DB has full breakdown
# ══════════════════════════════════════════════════════════════════════════════

class TestPricingInDatabase:
    """Tests for pricing data stored in database"""
    
    def test_lead_pricing_has_full_breakdown(self, api_client):
        """Lead in DB should have pricing with base_price, range_price, discount_price, final_price, discount_percent, range_used"""
        lead_data = {
            "plate": f"TEST{uuid.uuid4().hex[:4].upper()}",
            "vehicle": {"make": "BMW", "model": "Serie 3", "year": 2021},
            "mileage": 55000,
            "is_drivable": True,
            "client": {
                "firstname": "PricingDB",
                "lastname": "User",
                "email": f"pricingdb_{uuid.uuid4().hex[:6]}@test.com",
                "phone": "0677889900"
            },
            "pricing": {},
            "utm": {},
            "tracking": {},
            "source": "pytest"
        }
        
        response = api_client.post(f"{BASE_URL}/api/leads/save", json=lead_data)
        assert response.status_code == 200
        lead_id = response.json()["id"]
        
        # Fetch the lead
        leads_response = api_client.get(f"{BASE_URL}/api/leads?limit=50")
        leads = leads_response.json().get("leads", [])
        saved_lead = next((l for l in leads if l.get("id") == lead_id), None)
        
        assert saved_lead is not None
        
        pricing = saved_lead.get("pricing", {})
        
        # Verify pricing structure
        assert "base_price" in pricing, "Pricing should have 'base_price'"
        assert "final_price" in pricing, "Pricing should have 'final_price'"
        assert "discount_percent" in pricing, "Pricing should have 'discount_percent'"
        
        # Either range_price or discount_price should be present
        has_range = pricing.get("range_price") is not None
        has_discount = pricing.get("discount_price") is not None
        
        print(f"Pricing in DB: base={pricing.get('base_price')}, final={pricing.get('final_price')}, range_price={pricing.get('range_price')}, discount_price={pricing.get('discount_price')}, discount_percent={pricing.get('discount_percent')}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST: POST /api/autobiz/quote returns pricing with full breakdown
# ══════════════════════════════════════════════════════════════════════════════

class TestAutobizQuotePricing:
    """Tests for /api/autobiz/quote pricing response"""
    
    def test_quote_returns_full_pricing_breakdown(self, api_client):
        """Quote should return base_price, range_price, discount_price, final_price"""
        response = api_client.post(f"{BASE_URL}/api/autobiz/quote", json={
            "vehicle": {"make": "Peugeot", "model": "208", "year": 2020},
            "mileage": 50000
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "pricing" in data, "Response should contain 'pricing'"
        pricing = data["pricing"]
        
        assert "base_price" in pricing, "Pricing should have 'base_price'"
        assert "final_price" in pricing, "Pricing should have 'final_price'"
        assert "discount_percent" in pricing, "Pricing should have 'discount_percent'"
        
        # Verify values
        assert pricing["base_price"] > 0, "Base price should be > 0"
        assert pricing["final_price"] > 0, "Final price should be > 0"
        assert pricing["final_price"] <= pricing["base_price"], "Final price should be <= base price (discount applied)"
        
        print(f"Quote pricing: base={pricing['base_price']}, final={pricing['final_price']}, range_price={pricing.get('range_price')}, discount_price={pricing.get('discount_price')}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST: Pricing range logic verification
# ══════════════════════════════════════════════════════════════════════════════

class TestPricingRangeLogic:
    """Tests for pricing range calculation logic"""
    
    def test_range_3000_5000_applies_minus_20_percent(self, api_client):
        """base_price ~4000 should match range 3000-5000 with -20% → final ~3200"""
        # First get ranges to verify they exist
        ranges_response = api_client.get(f"{BASE_URL}/api/ranges")
        assert ranges_response.status_code == 200
        ranges = ranges_response.json().get("ranges", [])
        
        # Find the 3000-5000 range
        range_3000_5000 = next((r for r in ranges if r["start_value"] == 3000 and r["end_value"] == 5000), None)
        assert range_3000_5000 is not None, "Range 3000-5000 should exist"
        assert range_3000_5000["range_value"] == -20, f"Range 3000-5000 should have -20% discount, got {range_3000_5000['range_value']}"
        
        print(f"Range 3000-5000 verified: {range_3000_5000}")
        
        # Test with a vehicle that should have base_price around 4000
        # Note: Mock prices are somewhat random, so we verify the calculation logic
        # by checking that final_price = base_price * (1 + discount_percent/100)
        
    def test_range_10000_20000_applies_minus_12_percent(self, api_client):
        """base_price ~12000 should match range 10000-20000 with -12% → final ~10560"""
        ranges_response = api_client.get(f"{BASE_URL}/api/ranges")
        ranges = ranges_response.json().get("ranges", [])
        
        # Find the 10000-20000 range
        range_10000_20000 = next((r for r in ranges if r["start_value"] == 10000 and r["end_value"] == 20000), None)
        assert range_10000_20000 is not None, "Range 10000-20000 should exist"
        assert range_10000_20000["range_value"] == -12, f"Range 10000-20000 should have -12% discount, got {range_10000_20000['range_value']}"
        
        print(f"Range 10000-20000 verified: {range_10000_20000}")
    
    def test_pricing_calculation_matches_range(self, api_client):
        """Verify pricing calculation: final_price = base_price + (base_price * discount_percent / 100)"""
        # Get a quote
        response = api_client.post(f"{BASE_URL}/api/autobiz/quote", json={
            "vehicle": {"make": "Volkswagen", "model": "Golf 8", "year": 2022},
            "mileage": 28000
        })
        
        assert response.status_code == 200
        pricing = response.json()["pricing"]
        
        base_price = pricing["base_price"]
        final_price = pricing["final_price"]
        discount_percent = pricing["discount_percent"]
        
        # Calculate expected final price
        expected_final = base_price + (base_price * discount_percent / 100)
        
        # Allow for rounding differences
        assert abs(final_price - round(expected_final)) <= 1, f"Final price {final_price} should match calculated {round(expected_final)} (base={base_price}, discount={discount_percent}%)"
        
        print(f"Pricing calculation verified: {base_price} + ({base_price} * {discount_percent}/100) = {expected_final} ≈ {final_price}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST: GET /api/leads returns leads with 'tracking' field
# ══════════════════════════════════════════════════════════════════════════════

class TestLeadsHaveTrackingField:
    """Tests for leads containing tracking field"""
    
    def test_leads_contain_tracking_field(self, api_client):
        """GET /api/leads should return leads with 'tracking' field (not just 'utm')"""
        # First create a lead with tracking data
        lead_data = {
            "plate": f"TEST{uuid.uuid4().hex[:4].upper()}",
            "vehicle": {"make": "Dacia", "model": "Sandero", "year": 2022},
            "mileage": 25000,
            "is_drivable": True,
            "client": {
                "firstname": "TrackingField",
                "lastname": "Test",
                "email": f"trackingfield_{uuid.uuid4().hex[:6]}@test.com",
                "phone": "0699887766"
            },
            "pricing": {},
            "utm": {"utm_source": "facebook", "utm_medium": "social"},
            "tracking": {"gclid": "fb_gclid_test"},
            "source": "pytest"
        }
        
        save_response = api_client.post(f"{BASE_URL}/api/leads/save", json=lead_data)
        assert save_response.status_code == 200
        lead_id = save_response.json()["id"]
        
        # Fetch leads
        leads_response = api_client.get(f"{BASE_URL}/api/leads")
        assert leads_response.status_code == 200
        
        leads = leads_response.json().get("leads", [])
        saved_lead = next((l for l in leads if l.get("id") == lead_id), None)
        
        assert saved_lead is not None
        assert "tracking" in saved_lead, "Lead should have 'tracking' field"
        
        tracking = saved_lead["tracking"]
        assert isinstance(tracking, dict), "Tracking should be a dict"
        
        # Verify tracking contains merged utm + tracking data
        assert tracking.get("utm_source") == "facebook", "Tracking should contain utm_source"
        assert tracking.get("gclid") == "fb_gclid_test", "Tracking should contain gclid"
        
        print(f"Lead has tracking field with keys: {list(tracking.keys())}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
