"""
Test suite for Garages and Appointments API endpoints.
Tests: GET /api/garages, GET /api/appointments/config, GET /api/appointments/available,
       POST /api/leads/save with appointment data, Admin CRUD for garages and appointment config.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://car-buyback-1.preview.emergentagent.com').rstrip('/')
ADMIN_PASSWORD = "changeme123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token for authenticated requests."""
    response = requests.post(
        f"{BASE_URL}/api/admin/login",
        json={"password": ADMIN_PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


@pytest.fixture
def auth_headers(admin_token):
    """Headers with admin token."""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


class TestPublicGaragesAPI:
    """Tests for public /api/garages endpoint."""

    def test_get_garages_returns_list(self):
        """GET /api/garages returns list of active garages sorted by display_order."""
        response = requests.get(f"{BASE_URL}/api/garages")
        assert response.status_code == 200
        data = response.json()
        assert "garages" in data
        assert isinstance(data["garages"], list)
        assert len(data["garages"]) >= 3  # 3 test garages seeded
        
        # Verify sorted by display_order
        orders = [g.get("display_order", 0) for g in data["garages"]]
        assert orders == sorted(orders), "Garages should be sorted by display_order"
        
        # Verify garage structure
        garage = data["garages"][0]
        assert "id" in garage
        assert "name" in garage
        assert "postal_code" in garage
        assert "active" in garage
        print(f"PASSED: GET /api/garages returns {len(data['garages'])} garages")

    def test_get_garages_with_postal_code_proximity(self):
        """GET /api/garages?postal_code=75011 returns garages sorted by proximity to 75xxx."""
        response = requests.get(f"{BASE_URL}/api/garages", params={"postal_code": "75011"})
        assert response.status_code == 200
        data = response.json()
        assert "garages" in data
        
        # Paris (75xxx) should be first when filtering by 75011
        if len(data["garages"]) > 0:
            first_garage = data["garages"][0]
            assert first_garage["postal_code"].startswith("75"), "Paris garage should be first for 75011"
            print(f"PASSED: Postal code proximity sorting works - first garage: {first_garage['name']}")

    def test_get_garages_only_active(self):
        """GET /api/garages returns only active garages."""
        response = requests.get(f"{BASE_URL}/api/garages")
        assert response.status_code == 200
        data = response.json()
        
        for garage in data["garages"]:
            assert garage.get("active") == True, f"Garage {garage['name']} should be active"
        print(f"PASSED: All {len(data['garages'])} returned garages are active")


class TestAppointmentConfigAPI:
    """Tests for /api/appointments/config endpoint."""

    def test_get_appointment_config(self):
        """GET /api/appointments/config returns default config."""
        response = requests.get(f"{BASE_URL}/api/appointments/config")
        assert response.status_code == 200
        data = response.json()
        
        # Verify config structure
        assert "active_days" in data
        assert "slots" in data
        assert "max_per_slot" in data
        
        # Verify default values
        assert data["active_days"] == [1, 2, 3, 4, 5], "Default active days should be Mon-Fri"
        assert "09:00" in data["slots"]
        assert data["max_per_slot"] >= 1
        print(f"PASSED: Appointment config returned with {len(data['slots'])} slots")


class TestAvailableSlotsAPI:
    """Tests for /api/appointments/available endpoint."""

    def test_get_available_slots(self):
        """GET /api/appointments/available returns available slots for garage+date."""
        # Get a garage ID first
        garages_resp = requests.get(f"{BASE_URL}/api/garages")
        garage_id = garages_resp.json()["garages"][0]["id"]
        
        # Use a weekday date (Monday 2026-01-05)
        response = requests.get(
            f"{BASE_URL}/api/appointments/available",
            params={"garage_id": garage_id, "date": "2026-01-05"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "slots" in data
        assert "date" in data
        assert "garage_id" in data
        assert data["date"] == "2026-01-05"
        assert data["garage_id"] == garage_id
        assert isinstance(data["slots"], list)
        print(f"PASSED: Available slots for 2026-01-05: {data['slots']}")

    def test_get_available_slots_disabled_date(self, auth_headers):
        """GET /api/appointments/available returns empty for disabled date."""
        # First add a disabled date via admin
        config_resp = requests.get(f"{BASE_URL}/api/admin/appointment-config", headers=auth_headers)
        config = config_resp.json()
        
        # Add a test disabled date
        test_date = "2026-12-25"
        config["disabled_dates"] = config.get("disabled_dates", []) + [test_date]
        requests.post(f"{BASE_URL}/api/admin/appointment-config", json=config, headers=auth_headers)
        
        # Get a garage ID
        garages_resp = requests.get(f"{BASE_URL}/api/garages")
        garage_id = garages_resp.json()["garages"][0]["id"]
        
        # Check disabled date returns no slots
        response = requests.get(
            f"{BASE_URL}/api/appointments/available",
            params={"garage_id": garage_id, "date": test_date}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["slots"] == [], f"Disabled date should have no slots, got: {data['slots']}"
        print(f"PASSED: Disabled date {test_date} returns no slots")


class TestLeadSaveWithAppointment:
    """Tests for POST /api/leads/save with appointment data."""

    def test_save_lead_with_appointment(self):
        """POST /api/leads/save with garage_id, appointment_date, appointment_time saves correctly."""
        # Get a garage
        garages_resp = requests.get(f"{BASE_URL}/api/garages")
        garage = garages_resp.json()["garages"][0]
        
        lead_data = {
            "plate": "TEST123",
            "vehicle": {"make": "TEST", "model": "Appointment"},
            "mileage": 50000,
            "is_drivable": True,
            "client": {
                "firstname": "TEST_Appointment",
                "lastname": "User",
                "email": "test_appt@example.com",
                "phone": "0600000000"
            },
            "pricing": {"base_price": 5000, "final_price": 4500},
            "garage_id": garage["id"],
            "garage_name": garage["name"],
            "appointment_date": "2026-01-06",
            "appointment_time": "10:00"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leads/save",
            json=lead_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data.get("status") == "saved"
        print(f"PASSED: Lead saved with appointment - ID: {data['id']}")

    def test_save_lead_creates_appointment_entry(self, auth_headers):
        """POST /api/leads/save creates entry in appointments collection."""
        # Get a garage
        garages_resp = requests.get(f"{BASE_URL}/api/garages")
        garage = garages_resp.json()["garages"][0]
        
        unique_time = "15:00"  # Use a unique slot
        test_date = "2026-01-07"
        
        lead_data = {
            "plate": "TEST456",
            "vehicle": {"make": "TEST", "model": "ApptEntry"},
            "mileage": 60000,
            "is_drivable": True,
            "client": {
                "firstname": "TEST_ApptEntry",
                "lastname": "User",
                "email": "test_entry@example.com",
                "phone": "0600000001"
            },
            "pricing": {"base_price": 6000, "final_price": 5400},
            "garage_id": garage["id"],
            "garage_name": garage["name"],
            "appointment_date": test_date,
            "appointment_time": unique_time
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leads/save",
            json=lead_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        # Check appointments via admin
        appts_resp = requests.get(f"{BASE_URL}/api/admin/appointments", headers=auth_headers)
        assert appts_resp.status_code == 200
        appts = appts_resp.json()["appointments"]
        
        # Find our appointment
        found = any(
            a["garage_id"] == garage["id"] and 
            a["date"] == test_date and 
            a["time"] == unique_time 
            for a in appts
        )
        assert found, f"Appointment entry not found for {test_date} {unique_time}"
        print(f"PASSED: Appointment entry created in appointments collection")


class TestAdminGaragesCRUD:
    """Tests for Admin CRUD operations on garages."""

    def test_admin_create_garage(self, auth_headers):
        """POST /api/admin/garages creates a new garage."""
        garage_data = {
            "name": f"TEST_Garage_{uuid.uuid4().hex[:8]}",
            "address": "123 Test Street",
            "postal_code": "75001",
            "city": "Paris",
            "phone": "01 00 00 00 00",
            "email": "test@garage.com",
            "hours": "Lun-Ven 9h-18h",
            "active": True,
            "display_order": 99,
            "notes": "Test garage"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/garages",
            json=garage_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data.get("created") == True
        print(f"PASSED: Admin created garage with ID: {data['id']}")
        return data["id"]

    def test_admin_get_garages(self, auth_headers):
        """GET /api/admin/garages returns all garages (including inactive)."""
        response = requests.get(f"{BASE_URL}/api/admin/garages", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "garages" in data
        assert len(data["garages"]) >= 3
        print(f"PASSED: Admin GET garages returns {len(data['garages'])} garages")

    def test_admin_update_garage(self, auth_headers):
        """PUT /api/admin/garages/{id} updates a garage."""
        # First create a garage
        create_data = {
            "name": f"TEST_Update_{uuid.uuid4().hex[:8]}",
            "address": "Original Address",
            "postal_code": "75002",
            "city": "Paris",
            "active": True,
            "display_order": 98
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/garages", json=create_data, headers=auth_headers)
        garage_id = create_resp.json()["id"]
        
        # Update it
        update_data = {
            "name": create_data["name"],
            "address": "Updated Address",
            "postal_code": "75003",
            "city": "Paris Updated",
            "active": False,
            "display_order": 97
        }
        response = requests.put(
            f"{BASE_URL}/api/admin/garages/{garage_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json().get("updated") == True
        print(f"PASSED: Admin updated garage {garage_id}")

    def test_admin_delete_garage(self, auth_headers):
        """DELETE /api/admin/garages/{id} deletes a garage."""
        # First create a garage to delete
        create_data = {
            "name": f"TEST_Delete_{uuid.uuid4().hex[:8]}",
            "address": "To Be Deleted",
            "postal_code": "75004",
            "city": "Paris",
            "active": True,
            "display_order": 100
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/garages", json=create_data, headers=auth_headers)
        garage_id = create_resp.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/admin/garages/{garage_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json().get("deleted") == True
        
        # Verify it's gone
        get_resp = requests.get(f"{BASE_URL}/api/admin/garages", headers=auth_headers)
        garage_ids = [g["id"] for g in get_resp.json()["garages"]]
        assert garage_id not in garage_ids, "Deleted garage should not appear in list"
        print(f"PASSED: Admin deleted garage {garage_id}")


class TestAdminAppointmentConfig:
    """Tests for Admin appointment configuration."""

    def test_admin_get_appointment_config(self, auth_headers):
        """GET /api/admin/appointment-config returns config."""
        response = requests.get(f"{BASE_URL}/api/admin/appointment-config", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "active_days" in data
        assert "slots" in data
        assert "max_per_slot" in data
        print(f"PASSED: Admin GET appointment config")

    def test_admin_update_appointment_config(self, auth_headers):
        """POST /api/admin/appointment-config updates config."""
        # Get current config
        get_resp = requests.get(f"{BASE_URL}/api/admin/appointment-config", headers=auth_headers)
        original_config = get_resp.json()
        
        # Update with new values
        new_config = {
            "active_days": [1, 2, 3, 4, 5],
            "slots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
            "slot_duration": 60,
            "max_per_slot": 2,
            "disabled_dates": original_config.get("disabled_dates", [])
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/appointment-config",
            json=new_config,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["max_per_slot"] == 2
        assert "17:00" in data["slots"]
        print(f"PASSED: Admin updated appointment config")
        
        # Restore original
        restore_config = {
            "active_days": original_config.get("active_days", [1, 2, 3, 4, 5]),
            "slots": original_config.get("slots", ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]),
            "slot_duration": original_config.get("slot_duration", 60),
            "max_per_slot": original_config.get("max_per_slot", 1),
            "disabled_dates": original_config.get("disabled_dates", [])
        }
        requests.post(f"{BASE_URL}/api/admin/appointment-config", json=restore_config, headers=auth_headers)


class TestSlotConcurrency:
    """Tests for booking concurrency protection (max_per_slot)."""

    def test_slot_becomes_unavailable_when_full(self, auth_headers):
        """Slot should become unavailable when max_per_slot is reached."""
        # Get a garage
        garages_resp = requests.get(f"{BASE_URL}/api/garages")
        garage = garages_resp.json()["garages"][0]
        
        # Use a unique date/time for this test
        test_date = "2026-01-08"
        test_time = "09:00"
        
        # Check initial availability
        avail_resp = requests.get(
            f"{BASE_URL}/api/appointments/available",
            params={"garage_id": garage["id"], "date": test_date}
        )
        initial_slots = avail_resp.json()["slots"]
        
        if test_time not in initial_slots:
            pytest.skip(f"Slot {test_time} already booked")
        
        # Book the slot
        lead_data = {
            "plate": "CONCUR1",
            "vehicle": {"make": "TEST", "model": "Concurrency"},
            "mileage": 70000,
            "is_drivable": True,
            "client": {
                "firstname": "TEST_Concurrency",
                "lastname": "User",
                "email": "concur@example.com",
                "phone": "0600000002"
            },
            "pricing": {"base_price": 7000, "final_price": 6300},
            "garage_id": garage["id"],
            "garage_name": garage["name"],
            "appointment_date": test_date,
            "appointment_time": test_time
        }
        
        requests.post(f"{BASE_URL}/api/leads/save", json=lead_data, headers={"Content-Type": "application/json"})
        
        # Check slot is now unavailable (max_per_slot=1)
        avail_resp2 = requests.get(
            f"{BASE_URL}/api/appointments/available",
            params={"garage_id": garage["id"], "date": test_date}
        )
        final_slots = avail_resp2.json()["slots"]
        
        assert test_time not in final_slots, f"Slot {test_time} should be unavailable after booking"
        print(f"PASSED: Slot {test_time} became unavailable after booking (max_per_slot protection)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
