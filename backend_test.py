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

    def test_vehicle_identify(self, plate="AA123BB"):
        """Test vehicle identification with known plate"""
        success, response = self.run_test(
            f"Vehicle Identify - {plate}",
            "POST",
            "vehicle/identify",
            200,
            data={"immatriculation": plate}
        )
        if success and response.get('found'):
            print(f"   Vehicle found: {response.get('marque')} {response.get('modele')}")
            return True, response
        return False, {}

    def test_vehicle_identify_unknown(self, plate="UNKNOWN123"):
        """Test vehicle identification with unknown plate"""
        success, response = self.run_test(
            f"Vehicle Identify Unknown - {plate}",
            "POST",
            "vehicle/identify",
            200,
            data={"immatriculation": plate}
        )
        # Should still return 200 but with mock data
        return success, response

    def test_vehicle_estimate(self, vehicle_data=None):
        """Test vehicle estimation"""
        if not vehicle_data:
            vehicle_data = {
                "marque": "Peugeot",
                "modele": "208",
                "annee": "2020"
            }
        success, response = self.run_test(
            "Vehicle Estimate",
            "POST",
            "vehicle/estimate",
            200,
            data=vehicle_data
        )
        if success and 'estimation' in response:
            print(f"   Estimation: {response['estimation']} EUR")
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

    def test_create_lead(self):
        """Test creating a lead"""
        lead_data = {
            "vehicule": {
                "immatriculation": "AA123BB",
                "marque": "Peugeot",
                "modele": "208",
                "version": "1.2 PureTech 100 Active",
                "annee": "2020",
                "carburant": "Essence",
                "kilometrage": "50000",
                "etat": "bon",
                "roulant": True,
                "importe": False,
                "premiere_main": True,
                "carnet_entretien": True,
                "factures_entretien": False,
                "defauts": ""
            },
            "client": {
                "nom": "Dupont",
                "prenom": "Jean",
                "email": "jean.dupont@test.com",
                "telephone": "0123456789",
                "code_postal": "75001"
            },
            "rdv": {
                "date": "2024-12-20",
                "heure": "10:00",
                "centre": "paris"
            },
            "photos": [],
            "estimation": 12000
        }
        
        success, response = self.run_test(
            "Create Lead",
            "POST",
            "leads",
            200,
            data=lead_data
        )
        if success and 'id' in response:
            print(f"   Lead created with ID: {response['id']}")
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
        if success and isinstance(response, list):
            print(f"   Found {len(response)} leads")
        return success, response

    def test_save_partial_lead(self):
        """Test saving partial lead"""
        partial_data = {
            "step": 1,
            "data": {
                "vehicule": {
                    "immatriculation": "AA123BB",
                    "marque": "Peugeot"
                }
            }
        }
        
        success, response = self.run_test(
            "Save Partial Lead",
            "POST",
            "leads/partial",
            200,
            data=partial_data
        )
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
        return success, response

def main():
    print("🚗 VenteFlash Auto API Testing")
    print("=" * 50)
    
    tester = VehicleBuybackAPITester()
    
    # Test basic connectivity
    tester.test_root_endpoint()
    
    # Test vehicle identification and estimation flow
    success, vehicle_data = tester.test_vehicle_identify("AA123BB")
    if success:
        tester.test_vehicle_estimate(vehicle_data)
    
    # Test with unknown plate
    tester.test_vehicle_identify_unknown("UNKNOWN123")
    
    # Test centers and appointments
    tester.test_get_centers()
    tester.test_get_appointment_slots()
    
    # Test lead creation and retrieval
    lead_id = None
    success, lead_id = tester.test_create_lead()
    tester.test_get_leads()
    
    # Test partial lead saving
    tester.test_save_partial_lead()
    
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