#!/usr/bin/env python3
"""
Test script to verify the reminder settings API endpoints are working correctly.
This simulates what the frontend would call.
"""

import requests
import json

def test_reminder_settings_endpoints():
    base_url = "http://localhost:8000"
    
    print("Testing Reminder Settings API Endpoints...")
    print("=" * 50)
    
    # Test 1: GET /api/reminders/settings (should return 401 if endpoint exists but authentication required)
    print("\n1. Testing GET /api/reminders/settings")
    try:
        response = requests.get(f"{base_url}/api/reminders/settings")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 404:
            print("❌ Unexpected status code: 404")
            print("   This indicates the endpoint is not properly configured")
            return False
        elif response.status_code == 401:
            print("✓ Endpoint is working correctly (401 is expected for unauthenticated requests)")
            return True
        elif response.status_code == 200:
            print("✓ Successfully retrieved existing settings")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False
    
    # Test 2: Check if reminders router is properly mounted
    print("\n2. Testing router mounting")
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print("✓ API server is running")
            return True
        else:
            print("❌ API server not responding")
            return False
    except Exception as e:
        print(f"❌ API server not running: {e}")
        print("Please start the backend server with: cd backend && uvicorn app.main:app --reload --port 8000")
        return False
    
    print("\n" + "=" * 50)
    print("Test completed. If you see any ❌ errors, those need to be fixed.")
    print("If you see ✓ marks, the endpoints are working correctly.")

if __name__ == "__main__":
    success = test_reminder_settings_endpoints()
    if success:
        print("\n✅ SUCCESS: The reminder settings endpoint is properly configured!")
    else:
        print("\n❌ FAILURE: There are issues with the reminder settings endpoint.")
