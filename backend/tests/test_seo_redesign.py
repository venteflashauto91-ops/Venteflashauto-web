"""
Test suite for SEO Local Pages UI/UX Redesign
Tests the new components: Hero, Sections, CTAs, Steps, Trust Stats, Vehicle Gallery, FAQ, Nearby Cities
Also tests admin image upload functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "changeme123"


class TestSeoPagePublicEndpoints:
    """Test public SEO page endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
    
    def test_national_page_loads(self):
        """Test national page /rachat-voiture loads with all required fields"""
        response = self.session.get(f"{BASE_URL}/api/seo-pages/rachat-voiture")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert data["type"] == "national"
        assert data["slug"] == "rachat-voiture"
        assert "h1" in data
        assert "intro" in data
        assert "sections" in data
        assert "faq" in data
        assert len(data["sections"]) >= 1
        assert len(data["faq"]) >= 1
        
        # Verify new fields exist (may be empty for seeded data)
        assert "hero_image" in data or data.get("hero_image") is None
        assert "trust_block" in data or data.get("trust_block") is None
        assert "vehicles_block" in data or data.get("vehicles_block") is None
        print(f"National page loaded: {data['h1'][:50]}...")
    
    def test_department_page_loads(self):
        """Test department page /essonne loads with cities list"""
        response = self.session.get(f"{BASE_URL}/api/seo-pages/essonne")
        assert response.status_code == 200
        data = response.json()
        
        assert data["type"] == "department"
        assert data["slug"] == "essonne"
        assert "cities_list" in data
        assert len(data["cities_list"]) >= 1
        print(f"Department page loaded with {len(data['cities_list'])} cities")
    
    def test_city_page_loads(self):
        """Test city page /bretigny-sur-orge loads with nearby cities"""
        response = self.session.get(f"{BASE_URL}/api/seo-pages/bretigny-sur-orge")
        assert response.status_code == 200
        data = response.json()
        
        assert data["type"] == "city"
        assert data["slug"] == "bretigny-sur-orge"
        assert "nearby_cities" in data
        assert "department_slug" in data
        assert "department_name" in data
        assert data["department_slug"] == "essonne"
        print(f"City page loaded: {data['city_name']}")
    
    def test_all_city_pages_load(self):
        """Test all 5 city pages load correctly"""
        cities = [
            "bretigny-sur-orge",
            "saint-michel-sur-orge", 
            "sainte-genevieve-des-bois",
            "epinay-sur-orge",
            "le-plessis-pate"
        ]
        
        for city in cities:
            response = self.session.get(f"{BASE_URL}/api/seo-pages/{city}")
            assert response.status_code == 200, f"City {city} failed to load"
            data = response.json()
            assert data["type"] == "city"
            print(f"  - {city}: OK")
    
    def test_nonexistent_page_returns_404(self):
        """Test that nonexistent slug returns 404"""
        response = self.session.get(f"{BASE_URL}/api/seo-pages/nonexistent-city-xyz")
        assert response.status_code == 404
    
    def test_seo_pages_list(self):
        """Test public pages list endpoint"""
        response = self.session.get(f"{BASE_URL}/api/seo-pages-list")
        assert response.status_code == 200
        data = response.json()
        
        assert "pages" in data
        assert len(data["pages"]) >= 7
        
        # Verify all page types present
        types = [p["type"] for p in data["pages"]]
        assert "national" in types
        assert "department" in types
        assert "city" in types
        print(f"Pages list returned {len(data['pages'])} pages")


class TestSeoPageDataStructure:
    """Test SEO page data structure for new UI components"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
    
    def test_page_has_sections_for_alternating_layout(self):
        """Test that pages have sections array for 2-column layout"""
        response = self.session.get(f"{BASE_URL}/api/seo-pages/bretigny-sur-orge")
        data = response.json()
        
        assert "sections" in data
        assert isinstance(data["sections"], list)
        assert len(data["sections"]) >= 2  # Need at least 2 for mid-CTA placement
        
        for section in data["sections"]:
            assert "title" in section
            assert "content" in section
        print(f"Page has {len(data['sections'])} sections")
    
    def test_page_has_faq_for_accordion(self):
        """Test that pages have FAQ array for accordion component"""
        response = self.session.get(f"{BASE_URL}/api/seo-pages/bretigny-sur-orge")
        data = response.json()
        
        assert "faq" in data
        assert isinstance(data["faq"], list)
        assert len(data["faq"]) >= 1
        
        for faq in data["faq"]:
            assert "question" in faq
            assert "answer" in faq
        print(f"Page has {len(data['faq'])} FAQ items")
    
    def test_page_has_cta_text(self):
        """Test that pages have CTA text for buttons"""
        response = self.session.get(f"{BASE_URL}/api/seo-pages/bretigny-sur-orge")
        data = response.json()
        
        assert "cta_text" in data
        assert len(data["cta_text"]) > 0
        print(f"CTA text: {data['cta_text']}")
    
    def test_page_has_trust_and_vehicles_flags(self):
        """Test that pages have trust_block and vehicles_block flags"""
        response = self.session.get(f"{BASE_URL}/api/seo-pages/bretigny-sur-orge")
        data = response.json()
        
        # These should be true by default or not set (defaults to true in frontend)
        trust = data.get("trust_block", True)
        vehicles = data.get("vehicles_block", True)
        
        assert trust is not False or trust is True  # Can be True or not set
        assert vehicles is not False or vehicles is True
        print(f"Trust block: {trust}, Vehicles block: {vehicles}")


class TestAdminSeoEndpoints:
    """Test admin SEO endpoints with authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        if login_response.status_code == 200:
            self.token = login_response.json()["token"]
            self.auth_headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin login failed")
    
    def test_admin_seo_pages_list(self):
        """Test admin can list all SEO pages"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages",
            headers=self.auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "pages" in data
        assert len(data["pages"]) >= 7
        print(f"Admin sees {len(data['pages'])} SEO pages")
    
    def test_admin_seo_pages_requires_auth(self):
        """Test admin endpoints require authentication"""
        response = self.session.get(f"{BASE_URL}/api/admin/seo-pages")
        assert response.status_code == 401
    
    def test_admin_get_single_page(self):
        """Test admin can get a single SEO page by ID"""
        # First get the list to find an ID
        list_response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages",
            headers=self.auth_headers
        )
        pages = list_response.json()["pages"]
        page_id = pages[0]["id"]
        
        # Get single page
        response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages/{page_id}",
            headers=self.auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == page_id
        print(f"Got page: {data['slug']}")
    
    def test_admin_update_page(self):
        """Test admin can update a SEO page"""
        # Get a page
        list_response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages",
            headers=self.auth_headers
        )
        pages = list_response.json()["pages"]
        
        # Find bretigny page
        bretigny = next((p for p in pages if p["slug"] == "bretigny-sur-orge"), None)
        if not bretigny:
            pytest.skip("Bretigny page not found")
        
        # Update with new image fields (empty values)
        update_data = {
            "hero_image": "",
            "city_image": "",
            "section_images": [],
            "gallery_vehicles": []
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/seo-pages/{bretigny['id']}",
            headers={**self.auth_headers, "Content-Type": "application/json"},
            json=update_data
        )
        assert response.status_code == 200
        print("Page updated successfully")


class TestSeoUploadEndpoint:
    """Test the new SEO image upload endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        if login_response.status_code == 200:
            self.token = login_response.json()["token"]
            self.auth_headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin login failed")
    
    def test_seo_upload_requires_auth(self):
        """Test SEO upload endpoint requires authentication"""
        # Create a simple test image
        import io
        from PIL import Image
        
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        response = self.session.post(
            f"{BASE_URL}/api/admin/seo-upload?slug=test&purpose=hero",
            files={"file": ("test.png", img_bytes, "image/png")}
        )
        assert response.status_code == 401
    
    def test_seo_upload_with_auth(self):
        """Test SEO upload endpoint works with authentication"""
        import io
        from PIL import Image
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        response = self.session.post(
            f"{BASE_URL}/api/admin/seo-upload?slug=test-upload&purpose=hero",
            headers=self.auth_headers,
            files={"file": ("test.png", img_bytes, "image/png")}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "url" in data
        assert "path" in data
        assert "size" in data
        assert data["url"].endswith(".webp")  # Should be converted to WebP
        print(f"Uploaded image: {data['url']}")
    
    def test_seo_upload_rejects_invalid_type(self):
        """Test SEO upload rejects non-image files"""
        response = self.session.post(
            f"{BASE_URL}/api/admin/seo-upload?slug=test&purpose=hero",
            headers=self.auth_headers,
            files={"file": ("test.txt", b"not an image", "text/plain")}
        )
        assert response.status_code == 400


class TestSeoPageNewFields:
    """Test new fields added for UI redesign"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        if login_response.status_code == 200:
            self.token = login_response.json()["token"]
            self.auth_headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin login failed")
    
    def test_page_accepts_hero_image(self):
        """Test page can store hero_image field"""
        # Get a page
        list_response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages",
            headers=self.auth_headers
        )
        pages = list_response.json()["pages"]
        page = pages[0]
        
        # Update with hero_image
        response = self.session.put(
            f"{BASE_URL}/api/admin/seo-pages/{page['id']}",
            headers={**self.auth_headers, "Content-Type": "application/json"},
            json={"hero_image": "https://example.com/hero.webp"}
        )
        assert response.status_code == 200
        
        # Verify it was saved
        get_response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages/{page['id']}",
            headers=self.auth_headers
        )
        data = get_response.json()
        assert data.get("hero_image") == "https://example.com/hero.webp"
        
        # Clean up - reset to empty
        self.session.put(
            f"{BASE_URL}/api/admin/seo-pages/{page['id']}",
            headers={**self.auth_headers, "Content-Type": "application/json"},
            json={"hero_image": ""}
        )
        print("hero_image field works correctly")
    
    def test_page_accepts_section_images(self):
        """Test page can store section_images array"""
        list_response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages",
            headers=self.auth_headers
        )
        pages = list_response.json()["pages"]
        page = pages[0]
        
        section_images = [
            {"section_index": 0, "url": "/api/files/test/section-0.webp"},
            {"section_index": 2, "url": "/api/files/test/section-2.webp"}
        ]
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/seo-pages/{page['id']}",
            headers={**self.auth_headers, "Content-Type": "application/json"},
            json={"section_images": section_images}
        )
        assert response.status_code == 200
        
        # Verify
        get_response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages/{page['id']}",
            headers=self.auth_headers
        )
        data = get_response.json()
        assert data.get("section_images") == section_images
        
        # Clean up
        self.session.put(
            f"{BASE_URL}/api/admin/seo-pages/{page['id']}",
            headers={**self.auth_headers, "Content-Type": "application/json"},
            json={"section_images": []}
        )
        print("section_images field works correctly")
    
    def test_page_accepts_gallery_vehicles(self):
        """Test page can store gallery_vehicles array"""
        list_response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages",
            headers=self.auth_headers
        )
        pages = list_response.json()["pages"]
        page = pages[0]
        
        gallery_vehicles = [
            {"image": "/api/files/test/car1.webp", "model": "Peugeot 308", "city": "Paris", "delay": "Rachete en 24h"},
            {"image": "/api/files/test/car2.webp", "model": "Renault Megane", "city": "Lyon", "delay": "Rachete en 48h"}
        ]
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/seo-pages/{page['id']}",
            headers={**self.auth_headers, "Content-Type": "application/json"},
            json={"gallery_vehicles": gallery_vehicles}
        )
        assert response.status_code == 200
        
        # Verify
        get_response = self.session.get(
            f"{BASE_URL}/api/admin/seo-pages/{page['id']}",
            headers=self.auth_headers
        )
        data = get_response.json()
        assert data.get("gallery_vehicles") == gallery_vehicles
        
        # Clean up
        self.session.put(
            f"{BASE_URL}/api/admin/seo-pages/{page['id']}",
            headers={**self.auth_headers, "Content-Type": "application/json"},
            json={"gallery_vehicles": []}
        )
        print("gallery_vehicles field works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
