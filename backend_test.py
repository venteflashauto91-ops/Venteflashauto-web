import requests
import sys
import json
from datetime import datetime

class VehicleBuybackAPITester:
    def __init__(self, base_url="https://car-buyback-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200] if response.text else "No response"
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_autobiz_identify(self, plate="AA123BB"):
        """Test Autobiz vehicle identification with known plate"""
        success, response = self.run_test(
            f"Autobiz Identify - {plate}",
            "POST",
            "autobiz/identify",
            200,
            data={"plate": plate}
        )
        if success and response.get('found'):
            vehicle = response.get('vehicle', {})
            print(f"   Vehicle found: {vehicle.get('make')} {vehicle.get('model')} ({vehicle.get('year')})")
            return True, response
        return False, {}

    def test_autobiz_identify_unknown(self, plate="UNKNOWN123"):
        """Test Autobiz vehicle identification with unknown plate"""
        success, response = self.run_test(
            f"Autobiz Identify Unknown - {plate}",
            "POST",
            "autobiz/identify",
            200,
            data={"plate": plate}
        )
        # Should still return 200 but with mock data
        return success, response

    def test_autobiz_quote(self, vehicle_data=None):
        """Test Autobiz quotation"""
        if not vehicle_data:
            vehicle_data = {
                "make": "Peugeot",
                "model": "208",
                "year": 2020,
                "fuel": "Essence"
            }
        success, response = self.run_test(
            "Autobiz Quote",
            "POST",
            "autobiz/quote",
            200,
            data={"vehicle": vehicle_data, "mileage": 50000}
        )
        if success and 'pricing' in response:
            pricing = response['pricing']
            print(f"   Base price: {pricing.get('base_price')} EUR")
            print(f"   Final price: {pricing.get('final_price')} EUR")
            print(f"   Discount: {pricing.get('discount_percent')}%")
        return success, response

    def test_get_centers(self):
        """Test getting centers"""
        success, response = self.run_test(
            "Get Centers",
            "GET",
            "centers",
            200
        )
        if success and 'centers' in response:
            print(f"   Found {len(response['centers'])} centers")
        return success, response

    def test_get_appointment_slots(self, date="2024-12-20"):
        """Test getting appointment slots"""
        success, response = self.run_test(
            "Get Appointment Slots",
            "GET",
            "appointments/slots",
            200,
            params={"date": date}
        )
        if success and 'slots' in response:
            print(f"   Found {len(response['slots'])} time slots")
        return success, response

    def test_get_ranges(self):
        """Test getting price ranges"""
        success, response = self.run_test(
            "Get Ranges",
            "GET",
            "ranges",
            200
        )
        if success and 'ranges' in response:
            ranges = response['ranges']
            print(f"   Found {len(ranges)} price ranges")
            for r in ranges[:3]:  # Show first 3 ranges
                print(f"   Range: {r.get('start_value')}-{r.get('end_value')} EUR -> {r.get('range_value')}%")
        return success, response

    def test_get_settings(self):
        """Test getting settings"""
        success, response = self.run_test(
            "Get Settings",
            "GET",
            "settings",
            200
        )
        if success:
            print(f"   Autobiz configured: {response.get('autobiz_configured')}")
            print(f"   Market value type: {response.get('autobiz_market_value')}")
        return success, response

    def test_save_lead(self):
        """Test saving a complete lead"""
        lead_data = {
            "plate": "AA123BB",
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
                "firstname": "Jean",
                "lastname": "Dupont",
                "email": "jean.dupont@test.com",
                "phone": "0123456789",
                "postal_code": "75001"
            },
            "pricing": {
                "base_price": 10000,
                "final_price": 8000,
                "discount_percent": -20
            },
            "photos": [],
            "utm": {},
            "source": "website"
        }
        
        success, response = self.run_test(
            "Save Lead",
            "POST",
            "leads/save",
            200,
            data=lead_data
        )
        if success and 'id' in response:
            print(f"   Lead created with ID: {response['id']}")
            print(f"   Status: {response.get('status')}")
            return True, response['id']
        return False, None

    def test_get_leads(self):
        """Test getting leads"""
        success, response = self.run_test(
            "Get Leads",
            "GET",
            "leads",
            200
        )
        if success and 'leads' in response:
            leads = response['leads']
            print(f"   Found {len(leads)} leads")
            print(f"   Total: {response.get('total', 0)}")
        return success, response

    def test_tracking(self):
        """Test tracking events"""
        tracking_data = {
            "event": "test_event",
            "properties": {
                "page": "test",
                "timestamp": datetime.now().isoformat()
            }
        }
        
        success, response = self.run_test(
            "Track Event",
            "POST",
            "tracking",
            200,
            data=tracking_data
        )
        if success and response.get('tracked'):
            print(f"   Event tracked successfully")
        return success, response

def main():
    print("🚗 VenteFlash Auto API Testing")
    print("=" * 50)
    
    tester = VehicleBuybackAPITester()
    
    # Test basic connectivity
    tester.test_root_endpoint()
    
    # Test configuration endpoints
    tester.test_get_settings()
    tester.test_get_ranges()
    
    # Test Autobiz integration (mocked)
    test_plates = ["AA123BB", "CC456DD", "GG012HH"]
    vehicle_data = None
    
    for plate in test_plates:
        success, response = tester.test_autobiz_identify(plate)
        if success and response.get('found'):
            vehicle_data = response.get('vehicle')
            # Test quotation with this vehicle
            tester.test_autobiz_quote(vehicle_data)
            break
    
    # Test with unknown plate (should still work with mock)
    tester.test_autobiz_identify_unknown("UNKNOWN123")
    
    # Test centers and appointments
    tester.test_get_centers()
    tester.test_get_appointment_slots()
    
    # Test lead creation and retrieval
    lead_id = None
    success, lead_id = tester.test_save_lead()
    tester.test_get_leads()
    
    # Test tracking
    tester.test_tracking()
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure.get('test', 'Unknown')}: {failure}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())