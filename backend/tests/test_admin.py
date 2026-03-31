"""
Admin Dashboard Backend API Tests
Tests for admin authentication, settings management, leads, ranges, and stats.
Admin password: changeme123 (from ADMIN_PASSWORD in .env)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://car-buyback-1.preview.emergentagent.com').rstrip('/')
ADMIN_PASSWORD = "changeme123"

# ── Test Fixtures ──────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def admin_token(api_client):
    """Get admin JWT token"""
    response = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed - skipping authenticated tests")

@pytest.fixture
def authenticated_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


# ── Admin Authentication Tests ─────────────────────────────────────────

class TestAdminLogin:
    """Admin login endpoint tests"""
    
    def test_login_with_correct_password_returns_token(self, api_client):
        """POST /api/admin/login with correct password returns JWT token"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        assert "expires_in" in data
        assert data["expires_in"] == 86400  # 24 hours in seconds
        print(f"✅ Login successful - token length: {len(data['token'])}, expires_in: {data['expires_in']}")
    
    def test_login_with_wrong_password_returns_401(self, api_client):
        """POST /api/admin/login with wrong password returns 401"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": "wrongpassword"})
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"✅ Wrong password correctly rejected: {data.get('detail')}")
    
    def test_login_with_empty_password_returns_401(self, api_client):
        """POST /api/admin/login with empty password returns 401"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": ""})
        assert response.status_code == 401
        print("✅ Empty password correctly rejected")


# ── Admin Settings Tests (Protected Routes) ────────────────────────────

class TestAdminSettingsAuth:
    """Admin settings endpoint authentication tests"""
    
    def test_get_settings_without_token_returns_401(self, api_client):
        """GET /api/admin/settings without token returns 401"""
        response = api_client.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 401
        print("✅ Settings endpoint correctly requires authentication")
    
    def test_get_settings_with_invalid_token_returns_401(self, api_client):
        """GET /api/admin/settings with invalid token returns 401"""
        api_client.headers.update({"Authorization": "Bearer invalid_token_here"})
        response = api_client.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 401
        print("✅ Invalid token correctly rejected")


class TestAdminSettings:
    """Admin settings CRUD tests"""
    
    def test_get_settings_with_valid_token_returns_settings(self, authenticated_client):
        """GET /api/admin/settings with valid token returns settings (secrets masked)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields exist
        expected_fields = [
            "autobiz_base_url", "autobiz_market_value", "autobiz_username", 
            "autobiz_password", "default_discount_percent", "enable_hubspot",
            "hubspot_api_key", "enable_webhook", "webhook_url"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✅ Settings retrieved - fields: {list(data.keys())}")
    
    def test_settings_secrets_are_masked(self, authenticated_client):
        """GET /api/admin/settings returns masked secrets (not plain text)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 200
        data = response.json()
        
        # Secret fields should be masked (empty or contain *)
        secret_fields = ["autobiz_username", "autobiz_password", "hubspot_api_key"]
        for field in secret_fields:
            value = data.get(field, "")
            if value:  # If not empty, should be masked
                # Masked values either contain * or are short (<=4 chars all *)
                assert "*" in value or len(value) <= 4, f"Secret field {field} not masked: {value}"
        
        print("✅ Secret fields are properly masked")
    
    def test_update_settings_persists_changes(self, authenticated_client):
        """POST /api/admin/settings updates settings in MongoDB"""
        # Get current settings
        get_response = authenticated_client.get(f"{BASE_URL}/api/admin/settings")
        original_settings = get_response.json()
        
        # Update a non-secret field
        new_discount = 5.5
        update_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/settings",
            json={"default_discount_percent": new_discount}
        )
        assert update_response.status_code == 200
        updated_data = update_response.json()
        assert updated_data.get("default_discount_percent") == new_discount
        
        # Verify persistence with GET
        verify_response = authenticated_client.get(f"{BASE_URL}/api/admin/settings")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data.get("default_discount_percent") == new_discount
        
        # Restore original value
        authenticated_client.post(
            f"{BASE_URL}/api/admin/settings",
            json={"default_discount_percent": original_settings.get("default_discount_percent", 0)}
        )
        
        print(f"✅ Settings update persisted: default_discount_percent = {new_discount}")
    
    def test_update_with_masked_secret_does_not_overwrite(self, authenticated_client):
        """POST /api/admin/settings with masked secret value does NOT overwrite real secret"""
        # First, set a real secret value
        test_secret = f"test_secret_{uuid.uuid4().hex[:8]}"
        authenticated_client.post(
            f"{BASE_URL}/api/admin/settings",
            json={"autobiz_username": test_secret}
        )
        
        # Get settings (secret will be masked)
        get_response = authenticated_client.get(f"{BASE_URL}/api/admin/settings")
        masked_value = get_response.json().get("autobiz_username")
        
        # Try to update with the masked value (simulating frontend sending back masked value)
        authenticated_client.post(
            f"{BASE_URL}/api/admin/settings",
            json={"autobiz_username": masked_value, "autobiz_market_value": "tradeIn"}
        )
        
        # Verify the secret was NOT overwritten with masked value
        # We can't directly verify the unmasked value, but we can check it's still masked
        verify_response = authenticated_client.get(f"{BASE_URL}/api/admin/settings")
        verify_data = verify_response.json()
        
        # The masked value should still be the same (not changed to literal asterisks)
        assert verify_data.get("autobiz_username") == masked_value
        
        # Clean up - set back to empty
        authenticated_client.post(
            f"{BASE_URL}/api/admin/settings",
            json={"autobiz_username": ""}
        )
        
        print("✅ Masked secret value correctly NOT overwritten")
    
    def test_update_toggle_fields(self, authenticated_client):
        """POST /api/admin/settings can toggle boolean fields"""
        # Get current state
        get_response = authenticated_client.get(f"{BASE_URL}/api/admin/settings")
        original = get_response.json()
        
        # Toggle enable_hubspot
        new_value = not original.get("enable_hubspot", False)
        update_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/settings",
            json={"enable_hubspot": new_value}
        )
        assert update_response.status_code == 200
        assert update_response.json().get("enable_hubspot") == new_value
        
        # Restore original
        authenticated_client.post(
            f"{BASE_URL}/api/admin/settings",
            json={"enable_hubspot": original.get("enable_hubspot", False)}
        )
        
        print(f"✅ Toggle field updated: enable_hubspot = {new_value}")


# ── Admin Leads Tests ──────────────────────────────────────────────────

class TestAdminLeads:
    """Admin leads endpoint tests"""
    
    def test_get_leads_without_token_returns_401(self, api_client):
        """GET /api/admin/leads without token returns 401"""
        response = api_client.get(f"{BASE_URL}/api/admin/leads")
        assert response.status_code == 401
        print("✅ Admin leads endpoint correctly requires authentication")
    
    def test_get_leads_returns_paginated_list(self, authenticated_client):
        """GET /api/admin/leads returns leads with pagination"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/leads?limit=10&skip=0")
        assert response.status_code == 200
        data = response.json()
        
        # Verify pagination fields
        assert "leads" in data
        assert "total" in data
        assert "limit" in data
        assert "skip" in data
        assert isinstance(data["leads"], list)
        assert data["limit"] == 10
        assert data["skip"] == 0
        
        print(f"✅ Admin leads retrieved: {len(data['leads'])} of {data['total']} total")
    
    def test_get_leads_pagination_works(self, authenticated_client):
        """GET /api/admin/leads pagination skip parameter works"""
        # Get first page
        page1 = authenticated_client.get(f"{BASE_URL}/api/admin/leads?limit=5&skip=0")
        assert page1.status_code == 200
        page1_data = page1.json()
        
        # Get second page
        page2 = authenticated_client.get(f"{BASE_URL}/api/admin/leads?limit=5&skip=5")
        assert page2.status_code == 200
        page2_data = page2.json()
        
        # If there are enough leads, pages should be different
        if page1_data["total"] > 5:
            page1_ids = [l.get("id") for l in page1_data["leads"]]
            page2_ids = [l.get("id") for l in page2_data["leads"]]
            # No overlap between pages
            assert not set(page1_ids) & set(page2_ids), "Pages should not overlap"
        
        print(f"✅ Pagination working - page1: {len(page1_data['leads'])}, page2: {len(page2_data['leads'])}")


# ── Admin Ranges Tests ─────────────────────────────────────────────────

class TestAdminRanges:
    """Admin ranges CRUD tests"""
    
    def test_get_ranges_without_token_returns_401(self, api_client):
        """GET /api/admin/ranges without token returns 401"""
        response = api_client.get(f"{BASE_URL}/api/admin/ranges")
        assert response.status_code == 401
        print("✅ Admin ranges endpoint correctly requires authentication")
    
    def test_get_ranges_returns_list(self, authenticated_client):
        """GET /api/admin/ranges returns price ranges"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/ranges")
        assert response.status_code == 200
        data = response.json()
        
        assert "ranges" in data
        assert isinstance(data["ranges"], list)
        
        # Verify range structure
        if data["ranges"]:
            r = data["ranges"][0]
            assert "id" in r
            assert "start_value" in r
            assert "end_value" in r
            assert "range_value" in r
        
        print(f"✅ Admin ranges retrieved: {len(data['ranges'])} ranges")
    
    def test_create_range_and_verify(self, authenticated_client):
        """POST /api/admin/ranges creates new range"""
        new_range = {
            "start_value": 100000,
            "end_value": 150000,
            "range_value": -5
        }
        
        # Create range
        create_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/ranges",
            json=new_range
        )
        assert create_response.status_code == 200
        create_data = create_response.json()
        assert "id" in create_data
        assert create_data.get("created") == True
        range_id = create_data["id"]
        
        # Verify in list
        list_response = authenticated_client.get(f"{BASE_URL}/api/admin/ranges")
        ranges = list_response.json().get("ranges", [])
        range_ids = [r.get("id") for r in ranges]
        assert range_id in range_ids
        
        # Clean up - delete the range
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/admin/ranges/{range_id}")
        assert delete_response.status_code == 200
        
        print(f"✅ Range created and verified: {range_id}")
    
    def test_delete_range(self, authenticated_client):
        """DELETE /api/admin/ranges/{id} deletes range"""
        # First create a range to delete
        create_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/ranges",
            json={"start_value": 200000, "end_value": 250000, "range_value": -3}
        )
        range_id = create_response.json()["id"]
        
        # Delete the range
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/admin/ranges/{range_id}")
        assert delete_response.status_code == 200
        assert delete_response.json().get("deleted") == True
        
        # Verify deletion
        list_response = authenticated_client.get(f"{BASE_URL}/api/admin/ranges")
        ranges = list_response.json().get("ranges", [])
        range_ids = [r.get("id") for r in ranges]
        assert range_id not in range_ids
        
        print(f"✅ Range deleted: {range_id}")
    
    def test_delete_nonexistent_range_returns_404(self, authenticated_client):
        """DELETE /api/admin/ranges/{id} with invalid id returns 404"""
        response = authenticated_client.delete(f"{BASE_URL}/api/admin/ranges/nonexistent-id-12345")
        assert response.status_code == 404
        print("✅ Delete nonexistent range correctly returns 404")


# ── Admin Stats Tests ──────────────────────────────────────────────────

class TestAdminStats:
    """Admin stats endpoint tests"""
    
    def test_get_stats_without_token_returns_401(self, api_client):
        """GET /api/admin/stats without token returns 401"""
        response = api_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
        print("✅ Admin stats endpoint correctly requires authentication")
    
    def test_get_stats_returns_summary(self, authenticated_client):
        """GET /api/admin/stats returns summary (total leads, drivable, integrations status)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert "total_leads" in data
        assert "drivable_leads" in data
        assert "non_drivable_leads" in data
        assert "autobiz_configured" in data
        assert "hubspot_enabled" in data
        assert "webhook_enabled" in data
        
        # Verify types
        assert isinstance(data["total_leads"], int)
        assert isinstance(data["drivable_leads"], int)
        assert isinstance(data["non_drivable_leads"], int)
        assert isinstance(data["autobiz_configured"], bool)
        assert isinstance(data["hubspot_enabled"], bool)
        assert isinstance(data["webhook_enabled"], bool)
        
        # Verify consistency
        assert data["drivable_leads"] + data["non_drivable_leads"] <= data["total_leads"]
        
        print(f"✅ Stats retrieved: total={data['total_leads']}, drivable={data['drivable_leads']}, non_drivable={data['non_drivable_leads']}")


# ── Token Expiry Tests ─────────────────────────────────────────────────

class TestTokenExpiry:
    """JWT token validation tests"""
    
    def test_token_format_is_jwt(self, api_client):
        """Login returns properly formatted JWT token"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        token = response.json().get("token")
        
        # JWT has 3 parts separated by dots
        parts = token.split(".")
        assert len(parts) == 3, "JWT should have 3 parts"
        
        print(f"✅ Token is valid JWT format with 3 parts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
