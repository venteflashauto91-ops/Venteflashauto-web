"""
Test suite for SEO Pages feature.
Tests 7 SEO pages: 1 national + 1 department (Essonne) + 5 cities
Tests public endpoints and admin CRUD operations.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "changeme123"

# ── Fixtures ──

@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token for protected endpoints."""
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    if r.status_code == 200:
        return r.json().get("token")
    pytest.skip("Admin login failed - skipping admin tests")

@pytest.fixture(scope="module")
def auth_headers(admin_token):
    """Headers with admin auth token."""
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ── Public SEO Pages Tests ──

class TestPublicSeoPages:
    """Test public SEO page endpoints."""

    def test_national_page_rachat_voiture(self):
        """GET /api/seo-pages/rachat-voiture returns national page data."""
        r = requests.get(f"{BASE_URL}/api/seo-pages/rachat-voiture")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert data["slug"] == "rachat-voiture"
        assert data["type"] == "national"
        assert "h1" in data
        assert "Rachat" in data["h1"]
        assert "intro" in data
        assert "sections" in data
        assert len(data["sections"]) >= 4
        assert "faq" in data
        assert len(data["faq"]) >= 5
        assert "departments_list" in data
        assert any(d["slug"] == "essonne" for d in data["departments_list"])
        assert data["active"] == True
        print(f"PASSED: National page has {len(data['sections'])} sections, {len(data['faq'])} FAQ items")

    def test_department_page_essonne(self):
        """GET /api/seo-pages/essonne returns department page with cities_list."""
        r = requests.get(f"{BASE_URL}/api/seo-pages/essonne")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert data["slug"] == "essonne"
        assert data["type"] == "department"
        assert data["department_name"] == "Essonne"
        assert data["department_code"] == "91"
        assert "h1" in data
        assert "Essonne" in data["h1"]
        assert "intro" in data
        assert "sections" in data
        assert len(data["sections"]) >= 5
        assert "faq" in data
        assert len(data["faq"]) >= 5
        assert "cities_list" in data
        assert len(data["cities_list"]) == 5
        city_slugs = [c["slug"] for c in data["cities_list"]]
        assert "bretigny-sur-orge" in city_slugs
        assert "saint-michel-sur-orge" in city_slugs
        assert "sainte-genevieve-des-bois" in city_slugs
        assert "epinay-sur-orge" in city_slugs
        assert "le-plessis-pate" in city_slugs
        print(f"PASSED: Department page has {len(data['cities_list'])} cities")

    def test_city_page_bretigny_sur_orge(self):
        """GET /api/seo-pages/bretigny-sur-orge returns city page with sections, faq, nearby_cities."""
        r = requests.get(f"{BASE_URL}/api/seo-pages/bretigny-sur-orge")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert data["slug"] == "bretigny-sur-orge"
        assert data["type"] == "city"
        assert data["city_name"] == "Bretigny-sur-Orge"
        assert data["department_slug"] == "essonne"
        assert data["department_name"] == "Essonne"
        assert data["department_code"] == "91"
        assert "h1" in data
        assert "Bretigny" in data["h1"]
        assert "intro" in data
        assert "sections" in data
        assert len(data["sections"]) == 5
        assert "faq" in data
        assert len(data["faq"]) == 5
        assert "nearby_cities" in data
        assert len(data["nearby_cities"]) >= 3
        assert data["trust_block"] == True
        assert data["vehicles_block"] == True
        print(f"PASSED: Bretigny page has {len(data['sections'])} sections, {len(data['nearby_cities'])} nearby cities")

    def test_city_page_saint_michel_sur_orge(self):
        """GET /api/seo-pages/saint-michel-sur-orge returns unique content."""
        r = requests.get(f"{BASE_URL}/api/seo-pages/saint-michel-sur-orge")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert data["slug"] == "saint-michel-sur-orge"
        assert data["type"] == "city"
        assert data["city_name"] == "Saint-Michel-sur-Orge"
        assert "Saint-Michel" in data["h1"]
        assert "Saint-Michel" in data["intro"]
        assert len(data["sections"]) == 5
        assert len(data["faq"]) == 5
        print("PASSED: Saint-Michel-sur-Orge page has unique content")

    def test_city_page_sainte_genevieve_des_bois(self):
        """GET /api/seo-pages/sainte-genevieve-des-bois returns unique content."""
        r = requests.get(f"{BASE_URL}/api/seo-pages/sainte-genevieve-des-bois")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert data["slug"] == "sainte-genevieve-des-bois"
        assert data["type"] == "city"
        assert data["city_name"] == "Sainte-Genevieve-des-Bois"
        assert "Sainte-Genevieve" in data["h1"]
        assert len(data["sections"]) == 5
        assert len(data["faq"]) == 5
        print("PASSED: Sainte-Genevieve-des-Bois page has unique content")

    def test_city_page_epinay_sur_orge(self):
        """GET /api/seo-pages/epinay-sur-orge returns unique content."""
        r = requests.get(f"{BASE_URL}/api/seo-pages/epinay-sur-orge")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert data["slug"] == "epinay-sur-orge"
        assert data["type"] == "city"
        assert data["city_name"] == "Epinay-sur-Orge"
        assert "Epinay" in data["h1"]
        assert len(data["sections"]) == 5
        assert len(data["faq"]) == 5
        print("PASSED: Epinay-sur-Orge page has unique content")

    def test_city_page_le_plessis_pate(self):
        """GET /api/seo-pages/le-plessis-pate returns unique content."""
        r = requests.get(f"{BASE_URL}/api/seo-pages/le-plessis-pate")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert data["slug"] == "le-plessis-pate"
        assert data["type"] == "city"
        assert data["city_name"] == "Le Plessis-Pate"
        assert "Plessis" in data["h1"]
        assert len(data["sections"]) == 5
        assert len(data["faq"]) == 5
        print("PASSED: Le Plessis-Pate page has unique content")

    def test_nonexistent_slug_returns_404(self):
        """GET /api/seo-pages/nonexistent-slug returns 404."""
        r = requests.get(f"{BASE_URL}/api/seo-pages/nonexistent-slug")
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"
        print("PASSED: Nonexistent slug returns 404")

    def test_seo_pages_list(self):
        """GET /api/seo-pages-list returns all active pages for sitemap."""
        r = requests.get(f"{BASE_URL}/api/seo-pages-list")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert "pages" in data
        assert len(data["pages"]) >= 7
        slugs = [p["slug"] for p in data["pages"]]
        assert "rachat-voiture" in slugs
        assert "essonne" in slugs
        assert "bretigny-sur-orge" in slugs
        print(f"PASSED: SEO pages list returns {len(data['pages'])} pages")


# ── Admin SEO Pages Tests ──

class TestAdminSeoPages:
    """Test admin SEO page CRUD endpoints."""

    def test_admin_list_seo_pages_requires_auth(self):
        """GET /api/admin/seo-pages requires admin auth."""
        r = requests.get(f"{BASE_URL}/api/admin/seo-pages")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("PASSED: Admin list requires auth")

    def test_admin_list_seo_pages(self, auth_headers):
        """GET /api/admin/seo-pages lists all 7 pages."""
        r = requests.get(f"{BASE_URL}/api/admin/seo-pages", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert "pages" in data
        assert len(data["pages"]) >= 7
        
        # Verify all 7 seeded pages exist
        slugs = [p["slug"] for p in data["pages"]]
        expected_slugs = ["rachat-voiture", "essonne", "bretigny-sur-orge", 
                         "saint-michel-sur-orge", "sainte-genevieve-des-bois",
                         "epinay-sur-orge", "le-plessis-pate"]
        for slug in expected_slugs:
            assert slug in slugs, f"Missing slug: {slug}"
        print(f"PASSED: Admin list returns {len(data['pages'])} pages with all 7 seeded")

    def test_admin_create_page_slug_uniqueness(self, auth_headers):
        """POST /api/admin/seo-pages enforces slug uniqueness."""
        # Try to create a page with existing slug
        r = requests.post(f"{BASE_URL}/api/admin/seo-pages", headers=auth_headers, json={
            "slug": "bretigny-sur-orge",  # Already exists
            "type": "city",
            "h1": "Duplicate test"
        })
        assert r.status_code == 409, f"Expected 409 for duplicate slug, got {r.status_code}: {r.text}"
        print("PASSED: Slug uniqueness enforced")

    def test_admin_create_update_delete_page(self, auth_headers):
        """Full CRUD cycle: create, update, delete a test page."""
        test_slug = "test-ville-temporaire"
        
        # CREATE
        create_payload = {
            "slug": test_slug,
            "type": "city",
            "city_name": "Test Ville",
            "department_slug": "essonne",
            "department_name": "Essonne",
            "department_code": "91",
            "seo_title": "Test SEO Title",
            "meta_description": "Test meta description",
            "h1": "Rachat voiture a Test Ville",
            "intro": "Test intro content",
            "sections": [{"title": "Section 1", "content": "Content 1"}],
            "faq": [{"question": "Q1?", "answer": "A1"}],
            "nearby_cities": [{"slug": "bretigny-sur-orge", "name": "Bretigny"}],
            "cta_text": "Estimer maintenant",
            "trust_block": True,
            "vehicles_block": True,
            "active": True,
            "noindex": False
        }
        r = requests.post(f"{BASE_URL}/api/admin/seo-pages", headers=auth_headers, json=create_payload)
        assert r.status_code == 200, f"Create failed: {r.status_code}: {r.text}"
        created = r.json()
        assert "id" in created
        page_id = created["id"]
        print(f"PASSED: Created test page with id={page_id}")
        
        # Verify it appears in public endpoint
        r = requests.get(f"{BASE_URL}/api/seo-pages/{test_slug}")
        assert r.status_code == 200, f"Public fetch failed: {r.status_code}"
        data = r.json()
        assert data["h1"] == "Rachat voiture a Test Ville"
        
        # UPDATE
        update_payload = {"h1": "Updated H1 Title", "intro": "Updated intro"}
        r = requests.put(f"{BASE_URL}/api/admin/seo-pages/{page_id}", headers=auth_headers, json=update_payload)
        assert r.status_code == 200, f"Update failed: {r.status_code}: {r.text}"
        print("PASSED: Updated test page")
        
        # Verify update
        r = requests.get(f"{BASE_URL}/api/seo-pages/{test_slug}")
        assert r.status_code == 200
        data = r.json()
        assert data["h1"] == "Updated H1 Title"
        assert data["intro"] == "Updated intro"
        
        # DELETE
        r = requests.delete(f"{BASE_URL}/api/admin/seo-pages/{page_id}", headers=auth_headers)
        assert r.status_code == 200, f"Delete failed: {r.status_code}: {r.text}"
        print("PASSED: Deleted test page")
        
        # Verify deletion
        r = requests.get(f"{BASE_URL}/api/seo-pages/{test_slug}")
        assert r.status_code == 404, f"Page should be deleted, got {r.status_code}"
        print("PASSED: Full CRUD cycle completed")

    def test_admin_update_nonexistent_page(self, auth_headers):
        """PUT /api/admin/seo-pages/{id} returns 404 for nonexistent page."""
        r = requests.put(f"{BASE_URL}/api/admin/seo-pages/nonexistent-id", 
                        headers=auth_headers, json={"h1": "Test"})
        assert r.status_code == 404, f"Expected 404, got {r.status_code}"
        print("PASSED: Update nonexistent returns 404")

    def test_admin_delete_nonexistent_page(self, auth_headers):
        """DELETE /api/admin/seo-pages/{id} returns 404 for nonexistent page."""
        r = requests.delete(f"{BASE_URL}/api/admin/seo-pages/nonexistent-id", headers=auth_headers)
        assert r.status_code == 404, f"Expected 404, got {r.status_code}"
        print("PASSED: Delete nonexistent returns 404")


# ── Content Uniqueness Tests ──

class TestContentUniqueness:
    """Verify each page has unique content."""

    def test_all_pages_have_unique_intros(self):
        """All 7 pages should have different intro content."""
        slugs = ["rachat-voiture", "essonne", "bretigny-sur-orge", 
                 "saint-michel-sur-orge", "sainte-genevieve-des-bois",
                 "epinay-sur-orge", "le-plessis-pate"]
        intros = []
        for slug in slugs:
            r = requests.get(f"{BASE_URL}/api/seo-pages/{slug}")
            assert r.status_code == 200
            intros.append(r.json()["intro"])
        
        # All intros should be unique
        assert len(set(intros)) == len(intros), "Some pages have duplicate intros"
        print("PASSED: All 7 pages have unique intro content")

    def test_all_pages_have_unique_h1(self):
        """All 7 pages should have different H1 titles."""
        slugs = ["rachat-voiture", "essonne", "bretigny-sur-orge", 
                 "saint-michel-sur-orge", "sainte-genevieve-des-bois",
                 "epinay-sur-orge", "le-plessis-pate"]
        h1s = []
        for slug in slugs:
            r = requests.get(f"{BASE_URL}/api/seo-pages/{slug}")
            assert r.status_code == 200
            h1s.append(r.json()["h1"])
        
        # All H1s should be unique
        assert len(set(h1s)) == len(h1s), "Some pages have duplicate H1s"
        print("PASSED: All 7 pages have unique H1 titles")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
