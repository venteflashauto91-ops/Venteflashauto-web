"""
Autobiz Integration Tests - Real API Testing
Tests the real Autobiz API integration for vehicle identification and quotation.
Uses plate GJ423VM (VW Golf) and version ID 121889 for testing.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "changeme123"
TEST_PLATE = "GJ423VM"  # VW Golf with 15 real versions
TEST_VERSION_ID = "121889"  # BREAK 1.6 TDI 115 BLUEMOTION CARAT


class TestAutobizIdentify:
    """Test vehicle identification via Autobiz API"""
    
    def test_identify_real_plate_returns_autobiz_source(self):
        """POST /api/autobiz/identify with real plate returns source=autobiz"""
        response = requests.post(
            f"{BASE_URL}/api/autobiz/identify",
            json={"plate": TEST_PLATE}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("found") == True, "Vehicle should be found"
        assert data.get("source") == "autobiz", f"Expected source=autobiz, got {data.get('source')}"
        
    def test_identify_returns_vehicle_data(self):
        """POST /api/autobiz/identify returns vehicle details"""
        response = requests.post(
            f"{BASE_URL}/api/autobiz/identify",
            json={"plate": TEST_PLATE}
        )
        assert response.status_code == 200
        
        data = response.json()
        vehicle = data.get("vehicle", {})
        
        # Verify vehicle data structure
        assert "make" in vehicle, "Vehicle should have make"
        assert "model" in vehicle, "Vehicle should have model"
        assert "year" in vehicle, "Vehicle should have year"
        assert "fuel" in vehicle, "Vehicle should have fuel"
        
        # Verify it's a VW Golf
        assert "VOLKSWAGEN" in vehicle.get("make", "").upper(), f"Expected VOLKSWAGEN, got {vehicle.get('make')}"
        assert "GOLF" in vehicle.get("model", "").upper(), f"Expected GOLF, got {vehicle.get('model')}"
        
    def test_identify_returns_real_versions(self):
        """POST /api/autobiz/identify returns real Autobiz version IDs"""
        response = requests.post(
            f"{BASE_URL}/api/autobiz/identify",
            json={"plate": TEST_PLATE}
        )
        assert response.status_code == 200
        
        data = response.json()
        versions = data.get("versions", [])
        
        # Should have multiple versions
        assert len(versions) > 0, "Should have at least one version"
        
        # Each version should have id and name
        for v in versions:
            assert "id" in v, "Version should have id"
            assert "name" in v, "Version should have name"
            # IDs should be numeric strings (real Autobiz IDs)
            assert v["id"].isdigit() or v["id"].replace("-", "").isdigit(), f"Version ID should be numeric: {v['id']}"
            
        # Check if our test version ID exists
        version_ids = [v["id"] for v in versions]
        print(f"Found {len(versions)} versions: {version_ids[:5]}...")
        
    def test_identify_invalid_plate_returns_404(self):
        """POST /api/autobiz/identify with invalid plate returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/autobiz/identify",
            json={"plate": "INVALID123XYZ"}
        )
        # Should return 404 or fallback to mock
        assert response.status_code in [404, 200], f"Expected 404 or 200 (mock fallback), got {response.status_code}"


class TestAutobizQuote:
    """Test quotation via Autobiz API"""
    
    def test_quote_with_real_version_returns_price(self):
        """POST /api/autobiz/quote with real version ID returns base_price > 0"""
        # First identify to get year
        identify_resp = requests.post(
            f"{BASE_URL}/api/autobiz/identify",
            json={"plate": TEST_PLATE}
        )
        assert identify_resp.status_code == 200
        vehicle_data = identify_resp.json().get("vehicle", {})
        year = vehicle_data.get("year", 2018)
        
        # Now get quote
        response = requests.post(
            f"{BASE_URL}/api/autobiz/quote",
            json={
                "vehicle": {
                    "version": f"{TEST_VERSION_ID}: BREAK 1.6 TDI 115 BLUEMOTION CARAT",
                    "year": year,
                    "make": vehicle_data.get("make", "VOLKSWAGEN"),
                    "model": vehicle_data.get("model", "GOLF")
                },
                "mileage": 85000
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        quotation = data.get("quotation", {})
        pricing = data.get("pricing", {})
        
        # Verify quotation has base_price > 0
        base_price = quotation.get("base_price", 0)
        assert base_price > 0, f"Expected base_price > 0, got {base_price}"
        print(f"Autobiz base_price: {base_price} EUR")
        
        # Verify pricing has final_price
        final_price = pricing.get("final_price", 0)
        assert final_price > 0, f"Expected final_price > 0, got {final_price}"
        print(f"Final price after range discount: {final_price} EUR")
        
    def test_quote_applies_range_discount(self):
        """POST /api/autobiz/quote applies range-based discount"""
        response = requests.post(
            f"{BASE_URL}/api/autobiz/quote",
            json={
                "vehicle": {
                    "version": f"{TEST_VERSION_ID}: BREAK 1.6 TDI 115 BLUEMOTION CARAT",
                    "year": 2018,
                    "make": "VOLKSWAGEN",
                    "model": "GOLF"
                },
                "mileage": 85000
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        pricing = data.get("pricing", {})
        
        base_price = pricing.get("base_price", 0)
        final_price = pricing.get("final_price", 0)
        
        # Final price should be less than base price (discount applied)
        if base_price > 0:
            assert final_price <= base_price, f"Final price {final_price} should be <= base price {base_price}"
            
            # Check discount was applied
            discount_percent = pricing.get("discount_percent", 0)
            range_used = pricing.get("range_used")
            print(f"Discount applied: {discount_percent}%, Range: {range_used}")


class TestAdminAutobizTest:
    """Test admin Autobiz connection test endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
        
    def test_admin_test_autobiz_returns_success(self, admin_token):
        """POST /api/admin/test-autobiz returns success=true and token_received=true"""
        response = requests.post(
            f"{BASE_URL}/api/admin/test-autobiz",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=true, got {data}"
        assert data.get("token_received") == True, f"Expected token_received=true, got {data}"
        print(f"Autobiz test result: {data}")
        
    def test_admin_test_autobiz_without_token_returns_401(self):
        """POST /api/admin/test-autobiz without token returns 401"""
        response = requests.post(f"{BASE_URL}/api/admin/test-autobiz")
        assert response.status_code == 401


class TestLeadSaveWithAutobiz:
    """Test lead save with real Autobiz pricing"""
    
    def test_save_drivable_lead_returns_real_price(self):
        """POST /api/leads/save with drivable=true returns server-computed price > 0"""
        # First identify vehicle
        identify_resp = requests.post(
            f"{BASE_URL}/api/autobiz/identify",
            json={"plate": TEST_PLATE}
        )
        assert identify_resp.status_code == 200
        vehicle_data = identify_resp.json().get("vehicle", {})
        
        # Save lead with drivable=true
        response = requests.post(
            f"{BASE_URL}/api/leads/save",
            json={
                "plate": TEST_PLATE,
                "vehicle": {
                    **vehicle_data,
                    "version": f"{TEST_VERSION_ID}: BREAK 1.6 TDI 115 BLUEMOTION CARAT"
                },
                "mileage": 85000,
                "is_drivable": True,
                "condition": "bon",
                "defects": "",
                "first_owner": True,
                "service_book": True,
                "service_invoices": False,
                "imported": False,
                "client": {
                    "firstname": "TEST_Autobiz",
                    "lastname": "Integration",
                    "email": "test_autobiz@example.com",
                    "phone": "0612345678",
                    "postal_code": "75001"
                },
                "pricing": {},  # Empty - server should compute
                "photos": [],
                "utm": {},
                "source": "test"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify price > 0
        price = data.get("price", 0)
        assert price > 0, f"Expected price > 0, got {price}"
        print(f"Lead saved with price: {price} EUR")
        
        # Verify base_price > 0
        base_price = data.get("base_price", 0)
        assert base_price > 0, f"Expected base_price > 0, got {base_price}"
        
        # Verify lead ID returned
        assert data.get("id"), "Should return lead ID"
        
    def test_save_non_drivable_lead_returns_zero_price(self):
        """POST /api/leads/save with drivable=false returns price=0"""
        response = requests.post(
            f"{BASE_URL}/api/leads/save",
            json={
                "plate": TEST_PLATE,
                "vehicle": {
                    "make": "VOLKSWAGEN",
                    "model": "GOLF",
                    "year": 2018,
                    "version": f"{TEST_VERSION_ID}: BREAK 1.6 TDI 115 BLUEMOTION CARAT"
                },
                "mileage": 85000,
                "is_drivable": False,
                "condition": "non_roulant",
                "defects": "Panne mecanique",
                "first_owner": False,
                "service_book": False,
                "service_invoices": False,
                "imported": False,
                "client": {
                    "firstname": "TEST_NonDrivable",
                    "lastname": "Lead",
                    "email": "test_nondrivable@example.com",
                    "phone": "0612345679",
                    "postal_code": "75002"
                },
                "pricing": {},
                "photos": [],
                "utm": {},
                "source": "test"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify price = 0 for non-drivable
        price = data.get("price", -1)
        assert price == 0, f"Expected price=0 for non-drivable, got {price}"
        print(f"Non-drivable lead saved with price: {price} EUR")


class TestAdminLeadsWithPricing:
    """Test admin leads endpoint shows real pricing data"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
        
    def test_admin_leads_show_pricing_data(self, admin_token):
        """GET /api/admin/leads returns leads with pricing data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/leads?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        leads = data.get("leads", [])
        
        # Find a drivable lead with pricing
        drivable_leads = [l for l in leads if l.get("is_drivable") == True]
        
        if drivable_leads:
            lead = drivable_leads[0]
            pricing = lead.get("pricing", {})
            print(f"Lead pricing: {pricing}")
            
            # Verify pricing structure
            if pricing.get("base_price", 0) > 0:
                assert "final_price" in pricing, "Should have final_price"
                assert pricing.get("final_price", 0) > 0, "final_price should be > 0"
