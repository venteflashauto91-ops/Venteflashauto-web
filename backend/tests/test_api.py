"""
VenteFlash Auto Backend API Tests
Tests for vehicle identification, quotation, leads, and other endpoints.
All Autobiz APIs are MOCKED in backend.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://car-buyback-1.preview.emergentagent.com').rstrip('/')

# ── Test Fixtures ──────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def test_lead_data():
    """Sample lead data for testing"""
    return {
        "plate": f"TEST{uuid.uuid4().hex[:4].upper()}",
        "vehicle": {
            "make": "Peugeot",
            "model": "208",
            "version": "1.2 PureTech 100 Active",
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
            "firstname": "TestJean",
            "lastname": "TestDupont",
            "email": f"test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "0612345678",
            "postal_code": "75001"
        },
        "pricing": {
            "base_price": 10000,
            "final_price": 8500,
            "discount_percent": -15
        },
        "photos": [],
        "utm": {"source": "test"},
        "source": "pytest"
    }


# ── Health & Configuration Tests ───────────────────────────────────────

class TestHealthEndpoints:
    """Health check and configuration endpoints"""
    
    def test_api_root_returns_200(self, api_client):
        """API root endpoint should return 200 with status ok"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert "autobiz_configured" in data
        print(f"API root OK - autobiz_configured: {data.get('autobiz_configured')}")
    
    def test_settings_returns_configuration(self, api_client):
        """Settings endpoint should return app configuration"""
        response = api_client.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "autobiz_market_value" in data
        assert "default_discount_percent" in data
        print(f"Settings: market_value={data.get('autobiz_market_value')}, discount={data.get('default_discount_percent')}")


# ── Autobiz Vehicle Identification Tests (MOCKED) ──────────────────────

class TestAutobizIdentify:
    """Vehicle identification via Autobiz (MOCKED backend)"""
    
    @pytest.mark.parametrize("plate,expected_make,expected_model", [
        ("AA123BB", "Peugeot", "208"),
        ("CC456DD", "Renault", "Clio V"),
        ("GG012HH", "Volkswagen", "Golf 8"),
        ("KK345LL", "BMW", "Serie 3"),
        ("AB123CD", "Toyota", "Yaris"),
    ])
    def test_identify_known_mock_plates(self, api_client, plate, expected_make, expected_model):
        """Known mock plates should return correct vehicle data"""
        response = api_client.post(f"{BASE_URL}/api/autobiz/identify", json={"plate": plate})
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") == True
        assert data.get("source") == "mock"
        vehicle = data.get("vehicle", {})
        assert vehicle.get("make") == expected_make
        assert vehicle.get("model") == expected_model
        print(f"Plate {plate}: {vehicle.get('make')} {vehicle.get('model')} ({vehicle.get('year')})")
    
    def test_identify_unknown_plate_returns_random_vehicle(self, api_client):
        """Unknown plates should return a random mock vehicle"""
        response = api_client.post(f"{BASE_URL}/api/autobiz/identify", json={"plate": "UNKNOWN999"})
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") == True
        assert data.get("source") == "mock"
        vehicle = data.get("vehicle", {})
        assert "make" in vehicle
        assert "model" in vehicle
        assert "year" in vehicle
        print(f"Unknown plate returned: {vehicle.get('make')} {vehicle.get('model')}")
    
    def test_identify_returns_versions_list(self, api_client):
        """Identification should return versions list for selection"""
        response = api_client.post(f"{BASE_URL}/api/autobiz/identify", json={"plate": "AA123BB"})
        assert response.status_code == 200
        data = response.json()
        versions = data.get("versions", [])
        assert len(versions) > 0
        assert all("id" in v and "name" in v for v in versions)
        print(f"Found {len(versions)} versions for AA123BB")


# ── Autobiz Quotation Tests (MOCKED) ───────────────────────────────────

class TestAutobizQuote:
    """Vehicle quotation via Autobiz (MOCKED backend)"""
    
    def test_quote_returns_pricing_data(self, api_client):
        """Quote endpoint should return pricing with base_price and final_price"""
        vehicle_data = {
            "make": "Peugeot",
            "model": "208",
            "year": 2020,
            "fuel": "Essence"
        }
        response = api_client.post(f"{BASE_URL}/api/autobiz/quote", json={
            "vehicle": vehicle_data,
            "mileage": 50000
        })
        assert response.status_code == 200
        data = response.json()
        assert "pricing" in data
        pricing = data["pricing"]
        assert "base_price" in pricing
        assert "final_price" in pricing
        assert pricing["base_price"] > 0
        assert pricing["final_price"] > 0
        print(f"Quote: base={pricing['base_price']}, final={pricing['final_price']}")
    
    def test_quote_applies_range_discount(self, api_client):
        """Quote should apply discount based on price ranges"""
        vehicle_data = {"make": "BMW", "model": "Serie 3", "year": 2021}
        response = api_client.post(f"{BASE_URL}/api/autobiz/quote", json={
            "vehicle": vehicle_data,
            "mileage": 55000
        })
        assert response.status_code == 200
        data = response.json()
        pricing = data["pricing"]
        # Final price should be less than or equal to base price (discount applied)
        assert pricing["final_price"] <= pricing["base_price"]
        print(f"BMW Quote: base={pricing['base_price']}, final={pricing['final_price']}, discount={pricing.get('discount_percent')}%")


# ── Leads CRUD Tests ───────────────────────────────────────────────────

class TestLeadsCRUD:
    """Lead creation and retrieval tests"""
    
    def test_save_lead_creates_record(self, api_client, test_lead_data):
        """POST /api/leads/save should create a new lead"""
        response = api_client.post(f"{BASE_URL}/api/leads/save", json=test_lead_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data.get("status") == "saved"
        print(f"Lead created: {data['id']}")
        return data["id"]
    
    def test_save_lead_and_verify_in_list(self, api_client, test_lead_data):
        """Created lead should appear in GET /api/leads"""
        # Create lead
        create_response = api_client.post(f"{BASE_URL}/api/leads/save", json=test_lead_data)
        assert create_response.status_code == 200
        lead_id = create_response.json()["id"]
        
        # Verify in list
        list_response = api_client.get(f"{BASE_URL}/api/leads")
        assert list_response.status_code == 200
        leads = list_response.json().get("leads", [])
        lead_ids = [l.get("id") for l in leads]
        assert lead_id in lead_ids
        print(f"Lead {lead_id} found in leads list")
    
    def test_get_leads_returns_list(self, api_client):
        """GET /api/leads should return leads list with total count"""
        response = api_client.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        assert "total" in data
        assert isinstance(data["leads"], list)
        print(f"Found {data['total']} leads")
    
    def test_save_non_drivable_lead(self, api_client, test_lead_data):
        """Non-drivable vehicle lead should save correctly"""
        test_lead_data["is_drivable"] = False
        test_lead_data["condition"] = "non_roulant"
        test_lead_data["defects"] = "Panne mecanique"
        test_lead_data["pricing"]["final_price"] = 0  # No price for non-drivable
        
        response = api_client.post(f"{BASE_URL}/api/leads/save", json=test_lead_data)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "saved"
        print(f"Non-drivable lead saved: {data['id']}")


# ── Centers & Appointments Tests ───────────────────────────────────────

class TestCentersAndAppointments:
    """Centers and appointment slots endpoints"""
    
    def test_get_centers_returns_list(self, api_client):
        """GET /api/centers should return list of centers"""
        response = api_client.get(f"{BASE_URL}/api/centers")
        assert response.status_code == 200
        data = response.json()
        assert "centers" in data
        centers = data["centers"]
        assert len(centers) == 5  # Expected 5 centers
        assert all("id" in c and "name" in c and "address" in c for c in centers)
        print(f"Found {len(centers)} centers")
    
    def test_get_appointment_slots(self, api_client):
        """GET /api/appointments/slots should return time slots"""
        response = api_client.get(f"{BASE_URL}/api/appointments/slots", params={"date": "2026-01-20"})
        assert response.status_code == 200
        data = response.json()
        assert "slots" in data
        assert len(data["slots"]) > 0
        print(f"Found {len(data['slots'])} appointment slots")


# ── Ranges Tests ───────────────────────────────────────────────────────

class TestRanges:
    """Price ranges configuration tests"""
    
    def test_get_ranges_returns_seeded_data(self, api_client):
        """GET /api/ranges should return seeded price ranges"""
        response = api_client.get(f"{BASE_URL}/api/ranges")
        assert response.status_code == 200
        data = response.json()
        assert "ranges" in data
        ranges = data["ranges"]
        assert len(ranges) >= 6  # At least 6 seeded ranges
        # Verify structure
        for r in ranges:
            assert "start_value" in r
            assert "end_value" in r
            assert "range_value" in r
        print(f"Found {len(ranges)} price ranges")


# ── Tracking Tests ─────────────────────────────────────────────────────

class TestTracking:
    """Event tracking endpoint tests"""
    
    def test_track_event_success(self, api_client):
        """POST /api/tracking should track events"""
        response = api_client.post(f"{BASE_URL}/api/tracking", json={
            "event": "test_event",
            "properties": {"source": "pytest", "page": "test"}
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("tracked") == True
        print("Event tracked successfully")


# ── Integration Flow Tests ─────────────────────────────────────────────

class TestIntegrationFlows:
    """End-to-end flow tests"""
    
    def test_full_estimation_flow(self, api_client):
        """Test complete flow: identify → quote → save lead"""
        # Step 1: Identify vehicle
        identify_response = api_client.post(f"{BASE_URL}/api/autobiz/identify", json={"plate": "AA123BB"})
        assert identify_response.status_code == 200
        vehicle_data = identify_response.json()
        assert vehicle_data.get("found") == True
        vehicle = vehicle_data.get("vehicle", {})
        versions = vehicle_data.get("versions", [])
        print(f"Step 1: Identified {vehicle.get('make')} {vehicle.get('model')}")
        
        # Step 2: Get quotation
        quote_response = api_client.post(f"{BASE_URL}/api/autobiz/quote", json={
            "vehicle": vehicle,
            "mileage": 45000
        })
        assert quote_response.status_code == 200
        pricing = quote_response.json().get("pricing", {})
        print(f"Step 2: Quote received - {pricing.get('final_price')} EUR")
        
        # Step 3: Save lead
        lead_data = {
            "plate": "AA123BB",
            "vehicle": {**vehicle, "version": versions[0]["name"] if versions else ""},
            "mileage": 45000,
            "is_drivable": True,
            "condition": "bon",
            "defects": "",
            "first_owner": True,
            "service_book": True,
            "service_invoices": True,
            "imported": False,
            "client": {
                "firstname": "IntegrationTest",
                "lastname": "User",
                "email": f"integration_{uuid.uuid4().hex[:6]}@test.com",
                "phone": "0698765432",
                "postal_code": "69001"
            },
            "pricing": pricing,
            "photos": [],
            "utm": {},
            "source": "integration_test"
        }
        save_response = api_client.post(f"{BASE_URL}/api/leads/save", json=lead_data)
        assert save_response.status_code == 200
        lead_id = save_response.json().get("id")
        print(f"Step 3: Lead saved - {lead_id}")
        
        # Step 4: Verify lead exists
        leads_response = api_client.get(f"{BASE_URL}/api/leads")
        assert leads_response.status_code == 200
        leads = leads_response.json().get("leads", [])
        assert any(l.get("id") == lead_id for l in leads)
        print("Step 4: Lead verified in database")
        
        print("✅ Full estimation flow completed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
