"""
Test script for AI microservice
Run this to verify all endpoints work correctly
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_intent():
    """Test intent detection"""
    print("\n=== Testing Intent Detection ===")
    
    test_cases = [
        "I need help cleaning my apartment tomorrow",
        "How much does it cost?",
        "Are you available today?",
        "Cancel my request",
    ]
    
    for text in test_cases:
        response = requests.post(
            f"{BASE_URL}/intent",
            json={"text": text}
        )
        print(f"\nInput: {text}")
        print(f"Result: {json.dumps(response.json(), indent=2)}")

def test_decision():
    """Test decision engine"""
    print("\n=== Testing Decision Engine ===")
    
    response = requests.post(
        f"{BASE_URL}/decision",
        json={
            "intent": "REQUEST_SERVICE",
            "state": "ASK_LOCATION",
            "known": {"service": "cleaning"}
        }
    )
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_trust():
    """Test trust scoring"""
    print("\n=== Testing Trust Scoring ===")
    
    response = requests.post(
        f"{BASE_URL}/trust",
        json={
            "identity_verified": True,
            "completed_tasks": 15,
            "avg_rating": 4.5,
            "on_time_completions": 14,
            "total_completions": 15,
            "disputes": 0
        }
    )
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_risk():
    """Test risk assessment"""
    print("\n=== Testing Risk Assessment ===")
    
    response = requests.post(
        f"{BASE_URL}/risk",
        json={
            "user_data": {
                "completed_tasks": 0,
                "trust_score": 25,
                "disputes": 0,
                "cancellations_last_7d": 0
            },
            "task_value": 1500,
            "recent_activity": []
        }
    )
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_matching():
    """Test matching optimization"""
    print("\n=== Testing Matching ===")
    
    response = requests.post(
        f"{BASE_URL}/matching",
        json={
            "helpers": [
                {
                    "id": "helper_1",
                    "trust_score": 85,
                    "latitude": 59.3293,
                    "longitude": 18.0686,
                    "is_available": True,
                    "hourly_rate": 50
                },
                {
                    "id": "helper_2",
                    "trust_score": 70,
                    "latitude": 59.3500,
                    "longitude": 18.1000,
                    "is_available": True,
                    "hourly_rate": 45
                }
            ],
            "task": {
                "id": "task_1",
                "latitude": 59.3326,
                "longitude": 18.0649,
                "max_budget": 60
            },
            "top_n": 3
        }
    )
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def run_all_tests():
    """Run all tests"""
    try:
        test_health()
        test_intent()
        test_decision()
        test_trust()
        test_risk()
        test_matching()
        
        print("\n✅ All tests completed!")
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to AI service")
        print("Make sure the service is running: python api.py")
    except Exception as e:
        print(f"\n❌ Test error: {e}")

if __name__ == "__main__":
    run_all_tests()
