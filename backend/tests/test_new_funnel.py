"""
Test suite for the refactored funnel endpoints:
- POST /api/leads/estimate - creates lead with lead_status=estimated, returns lead_id + price
- GET /api/leads/{lead_id}/result - returns lead data for result page
- PUT /api/leads/{lead_id}/appointment - updates lead to appointment_scheduled
- GET /api/garages - returns active garages
- GET /api/appointments/available - returns available slots for garage+date
- GET /api/admin/stats - returns estimated_leads, appointed_leads, conversion_rate, webhook_failures
- GET /api/admin/leads?lead_status=estimated - filters leads by status
- GET /api/admin/leads?has_appointment=false - filters leads without appointment
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://car-buyback-1.preview.emergentagent.com')
ADMIN_PASSWORD = "changeme123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token for protected endpoints"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def test_garage_id(admin_token):
    """Get or create a test garage for appointment tests"""
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    # Get existing garages
    response = requests.get(f"{BASE_URL}/api/admin/garages", headers=headers)
    assert response.status_code == 200
    garages = response.json().get("garages", [])
    if garages:
        return garages[0]["id"]
    # Create one if none exist
    garage_data = {
        "name": "TEST_Garage_Funnel",
        "address": "123 Test Street",
        "postal_code": "75011",
        "city": "Paris",
        "phone": "0142000000",
        "active": True,
        "display_order": 0
    }
    response = requests.post(f"{BASE_URL}/api/admin/garages", headers=headers, json=garage_data)
    assert response.status_code == 200
    return response.json()["id"]


class TestLeadsEstimateEndpoint:
    """Tests for POST /api/leads/estimate"""

    def test_estimate_lead_drivable_returns_lead_id_and_price(self):
        """POST /api/leads/estimate with drivable=true returns lead_id and price"""
        payload = {
            "plate": "TEST123",
            "vehicle": {"make": "Peugeot", "model": "308", "year": 2020, "fuel": "Diesel"},
            "mileage": 50000,
            "is_drivable": True,
            "condition": "bon",
            "defects": "",
            "first_owner": True,
            "service_book": True,
            "service_invoices": False,
            "imported": False,
            "client": {
                "firstname": "TEST_Jean",
                "lastname": "Dupont",
                "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
                "phone": "0612345678",
                "postal_code": "75011"
            },
            "photos": [],
            "utm": {"utm_source": "test"},
            "source": "website"
        }
        response = requests.post(f"{BASE_URL}/api/leads/estimate", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "lead_id" in data, "Response should contain lead_id"
        assert "price" in data, "Response should contain price"
        assert "is_drivable" in data, "Response should contain is_drivable"
        assert "success" in data, "Response should contain success"
        assert data["success"] is True
        assert data["is_drivable"] is True
        assert isinstance(data["lead_id"], str)
        assert len(data["lead_id"]) > 0
        # Price should be a number (could be 0 if Autobiz not configured)
        assert isinstance(data["price"], (int, float))
        
        # Store lead_id for cleanup
        self.created_lead_id = data["lead_id"]

    def test_estimate_lead_non_drivable_returns_zero_price(self):
        """POST /api/leads/estimate with drivable=false returns price=0"""
        payload = {
            "plate": "TEST456",
            "vehicle": {"make": "Renault", "model": "Clio", "year": 2018},
            "mileage": 80000,
            "is_drivable": False,
            "condition": "non_roulant",
            "defects": "Panne moteur",
            "first_owner": False,
            "service_book": False,
            "service_invoices": False,
            "imported": False,
            "client": {
                "firstname": "TEST_Marie",
                "lastname": "Martin",
                "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
                "phone": "0698765432",
                "postal_code": "69003"
            },
            "photos": [],
            "utm": {},
            "source": "website"
        }
        response = requests.post(f"{BASE_URL}/api/leads/estimate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["lead_id"] is not None
        assert data["price"] == 0, "Non-drivable vehicles should have price=0"
        assert data["is_drivable"] is False

    def test_estimate_lead_creates_lead_with_estimated_status(self):
        """POST /api/leads/estimate creates lead with lead_status=estimated"""
        payload = {
            "plate": "TEST789",
            "vehicle": {"make": "Citroen", "model": "C3", "year": 2019},
            "mileage": 60000,
            "is_drivable": True,
            "client": {
                "firstname": "TEST_Pierre",
                "lastname": "Durand",
                "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
                "phone": "0611223344"
            }
        }
        response = requests.post(f"{BASE_URL}/api/leads/estimate", json=payload)
        assert response.status_code == 200
        lead_id = response.json()["lead_id"]
        
        # Verify lead was created with correct status
        result_response = requests.get(f"{BASE_URL}/api/leads/{lead_id}/result")
        assert result_response.status_code == 200
        lead_data = result_response.json()
        assert lead_data["lead_status"] == "estimated", f"Expected lead_status=estimated, got {lead_data.get('lead_status')}"


class TestLeadResultEndpoint:
    """Tests for GET /api/leads/{lead_id}/result"""

    def test_get_lead_result_returns_lead_data(self):
        """GET /api/leads/{lead_id}/result returns complete lead data"""
        # First create a lead
        payload = {
            "plate": "RESULT01",
            "vehicle": {"make": "BMW", "model": "Serie 3", "year": 2021, "fuel": "Essence"},
            "mileage": 30000,
            "is_drivable": True,
            "client": {
                "firstname": "TEST_Result",
                "lastname": "Test",
                "email": f"result_{uuid.uuid4().hex[:8]}@test.com",
                "phone": "0699887766",
                "postal_code": "13008"
            }
        }
        create_response = requests.post(f"{BASE_URL}/api/leads/estimate", json=payload)
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Get lead result
        response = requests.get(f"{BASE_URL}/api/leads/{lead_id}/result")
        assert response.status_code == 200
        
        data = response.json()
        # Verify all expected fields are present
        assert data["id"] == lead_id
        assert data["plate"] == "RESULT01"
        assert data["vehicle"]["make"] == "BMW"
        assert data["mileage"] == 30000
        assert data["is_drivable"] is True
        assert "pricing" in data
        assert data["lead_status"] == "estimated"
        assert data["client"]["firstname"] == "TEST_Result"
        assert data["garage_id"] is None  # No appointment yet
        assert data["appointment_date"] is None

    def test_get_lead_result_not_found(self):
        """GET /api/leads/{invalid_id}/result returns 404"""
        response = requests.get(f"{BASE_URL}/api/leads/nonexistent-lead-id/result")
        assert response.status_code == 404


class TestAppointmentBookingEndpoint:
    """Tests for PUT /api/leads/{lead_id}/appointment"""

    def test_book_appointment_updates_lead_status(self, test_garage_id):
        """PUT /api/leads/{lead_id}/appointment updates lead to appointment_scheduled"""
        # Create a lead first
        payload = {
            "plate": "APPT001",
            "vehicle": {"make": "Audi", "model": "A4", "year": 2020},
            "mileage": 45000,
            "is_drivable": True,
            "client": {
                "firstname": "TEST_Appt",
                "lastname": "Booking",
                "email": f"appt_{uuid.uuid4().hex[:8]}@test.com",
                "phone": "0677889900"
            }
        }
        create_response = requests.post(f"{BASE_URL}/api/leads/estimate", json=payload)
        assert create_response.status_code == 200
        lead_id = create_response.json()["lead_id"]
        
        # Book appointment
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        appt_payload = {
            "garage_id": test_garage_id,
            "garage_name": "Test Garage",
            "appointment_date": tomorrow,
            "appointment_time": "10:00"
        }
        response = requests.put(f"{BASE_URL}/api/leads/{lead_id}/appointment", json=appt_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] is True
        assert data["lead_id"] == lead_id
        assert data["lead_status"] == "appointment_scheduled"
        assert data["appointment_id"] is not None
        assert data["garage_name"] == "Test Garage"
        assert data["appointment_date"] == tomorrow
        assert data["appointment_time"] == "10:00"
        
        # Verify lead was updated
        result_response = requests.get(f"{BASE_URL}/api/leads/{lead_id}/result")
        assert result_response.status_code == 200
        lead_data = result_response.json()
        assert lead_data["lead_status"] == "appointment_scheduled"
        assert lead_data["garage_id"] == test_garage_id
        assert lead_data["appointment_date"] == tomorrow
        assert lead_data["appointment_time"] == "10:00"

    def test_book_appointment_not_found_lead(self, test_garage_id):
        """PUT /api/leads/{invalid_id}/appointment returns 404"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        appt_payload = {
            "garage_id": test_garage_id,
            "garage_name": "Test Garage",
            "appointment_date": tomorrow,
            "appointment_time": "11:00"
        }
        response = requests.put(f"{BASE_URL}/api/leads/nonexistent-id/appointment", json=appt_payload)
        assert response.status_code == 404


class TestGaragesEndpoint:
    """Tests for GET /api/garages"""

    def test_get_garages_returns_active_garages(self):
        """GET /api/garages returns list of active garages"""
        response = requests.get(f"{BASE_URL}/api/garages")
        assert response.status_code == 200
        
        data = response.json()
        assert "garages" in data
        assert isinstance(data["garages"], list)
        # All returned garages should be active
        for garage in data["garages"]:
            assert garage.get("active", True) is True

    def test_get_garages_with_postal_code_sorts_by_proximity(self):
        """GET /api/garages?postal_code=75011 sorts garages by proximity"""
        response = requests.get(f"{BASE_URL}/api/garages", params={"postal_code": "75011"})
        assert response.status_code == 200
        
        data = response.json()
        assert "garages" in data
        # If there are garages with 75xxx postal codes, they should come first
        garages = data["garages"]
        if len(garages) > 1:
            # Check that 75xxx garages are prioritized
            paris_garages = [g for g in garages if g.get("postal_code", "")[:2] == "75"]
            if paris_garages:
                # First garage should be from Paris area
                assert garages[0].get("postal_code", "")[:2] == "75"


class TestAvailableSlotsEndpoint:
    """Tests for GET /api/appointments/available"""

    def test_get_available_slots_returns_slots(self, test_garage_id):
        """GET /api/appointments/available returns available slots for garage+date"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        response = requests.get(
            f"{BASE_URL}/api/appointments/available",
            params={"garage_id": test_garage_id, "date": tomorrow}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "date" in data
        assert "garage_id" in data
        assert "slots" in data
        assert isinstance(data["slots"], list)
        # Should have some available slots
        assert "all_slots" in data

    def test_get_available_slots_requires_params(self):
        """GET /api/appointments/available requires garage_id and date"""
        response = requests.get(f"{BASE_URL}/api/appointments/available")
        assert response.status_code == 422  # Missing required params


class TestAdminStatsEndpoint:
    """Tests for GET /api/admin/stats"""

    def test_admin_stats_returns_conversion_metrics(self, admin_token):
        """GET /api/admin/stats returns estimated_leads, appointed_leads, conversion_rate"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        # Verify all expected fields
        assert "total_leads" in data
        assert "estimated_leads" in data
        assert "appointed_leads" in data
        assert "conversion_rate" in data
        assert "webhook_failures" in data
        assert "drivable_leads" in data
        assert "non_drivable_leads" in data
        
        # Types check
        assert isinstance(data["total_leads"], int)
        assert isinstance(data["estimated_leads"], int)
        assert isinstance(data["appointed_leads"], int)
        assert isinstance(data["conversion_rate"], (int, float))
        assert isinstance(data["webhook_failures"], int)

    def test_admin_stats_requires_auth(self):
        """GET /api/admin/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401


class TestAdminLeadsFiltering:
    """Tests for GET /api/admin/leads with filters"""

    def test_admin_leads_filter_by_status_estimated(self, admin_token):
        """GET /api/admin/leads?lead_status=estimated returns only estimated leads"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/admin/leads",
            headers=headers,
            params={"lead_status": "estimated"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "leads" in data
        assert "total" in data
        # All returned leads should have status=estimated
        for lead in data["leads"]:
            assert lead.get("lead_status") == "estimated", f"Expected estimated, got {lead.get('lead_status')}"

    def test_admin_leads_filter_by_status_appointed(self, admin_token):
        """GET /api/admin/leads?lead_status=appointment_scheduled returns only appointed leads"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/admin/leads",
            headers=headers,
            params={"lead_status": "appointment_scheduled"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "leads" in data
        # All returned leads should have status=appointment_scheduled
        for lead in data["leads"]:
            assert lead.get("lead_status") == "appointment_scheduled"

    def test_admin_leads_filter_has_appointment_false(self, admin_token):
        """GET /api/admin/leads?has_appointment=false returns leads without appointment"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/admin/leads",
            headers=headers,
            params={"has_appointment": "false"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "leads" in data
        # All returned leads should not have appointment_status=scheduled
        for lead in data["leads"]:
            assert lead.get("appointment_status") != "scheduled"

    def test_admin_leads_requires_auth(self):
        """GET /api/admin/leads requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/leads")
        assert response.status_code == 401


class TestConcurrencyProtection:
    """Tests for appointment slot concurrency protection"""

    def test_slot_becomes_unavailable_when_booked(self, admin_token, test_garage_id):
        """Booking a slot should make it unavailable for others"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # Set max_per_slot to 1
        config_response = requests.get(f"{BASE_URL}/api/admin/appointment-config", headers=headers)
        config = config_response.json()
        config["max_per_slot"] = 1
        requests.post(f"{BASE_URL}/api/admin/appointment-config", headers=headers, json=config)
        
        # Create first lead and book
        payload1 = {
            "plate": "CONC001",
            "vehicle": {"make": "VW", "model": "Golf", "year": 2020},
            "mileage": 40000,
            "is_drivable": True,
            "client": {
                "firstname": "TEST_Conc1",
                "lastname": "Test",
                "email": f"conc1_{uuid.uuid4().hex[:8]}@test.com",
                "phone": "0611111111"
            }
        }
        create1 = requests.post(f"{BASE_URL}/api/leads/estimate", json=payload1)
        lead_id1 = create1.json()["lead_id"]
        
        # Use a date far in the future to avoid conflicts with other tests
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        appt1 = {
            "garage_id": test_garage_id,
            "garage_name": "Test Garage",
            "appointment_date": future_date,
            "appointment_time": "14:00"
        }
        book1 = requests.put(f"{BASE_URL}/api/leads/{lead_id1}/appointment", json=appt1)
        assert book1.status_code == 200
        
        # Check that slot is now unavailable
        slots_response = requests.get(
            f"{BASE_URL}/api/appointments/available",
            params={"garage_id": test_garage_id, "date": future_date}
        )
        slots_data = slots_response.json()
        assert "14:00" not in slots_data["slots"], "Slot 14:00 should be unavailable after booking"


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(admin_token):
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Cleanup would go here if needed
    pass
