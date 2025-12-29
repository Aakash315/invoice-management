#!/usr/bin/env python3
"""
Complete Test for Expense Categories API
Tests the full flow: Registration → Authentication → Expense Categories API
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api"

def test_health_check():
    """Test if the API is running"""
    print("🔍 Testing API Health...")
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            print("✅ API is healthy and running")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API is not accessible: {e}")
        return False

def test_user_registration():
    """Test user registration"""
    print("\n👤 Testing User Registration...")
    
    user_data = {
        "name": "Test User",
        "email": f"testuser_{int(time.time())}@example.com",
        "password": "testpassword123",
        "role": "user"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/register", json=user_data)
        if response.status_code == 201:
            data = response.json()
            print(f"✅ User registered successfully: {user_data['email']}")
            print(f"   Token received: {data['access_token'][:20]}...")
            return data['access_token']
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None

def test_user_login(email=None):
    """Test user login (use existing email if provided)"""
    print("\n🔐 Testing User Login...")
    
    if not email:
        # Generate a test email
        email = f"testuser_{int(time.time())}@example.com"
        # First register
        user_data = {
            "name": "Test User",
            "email": email,
            "password": "testpassword123",
            "role": "user"
        }
        reg_response = requests.post(f"{API_URL}/auth/register", json=user_data)
        if reg_response.status_code != 201:
            print(f"❌ Could not register test user: {reg_response.status_code}")
            return None
    
    login_data = {
        "email": email,
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful for: {email}")
            print(f"   Token received: {data['access_token'][:20]}...")
            return data['access_token']
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_expense_categories_without_auth():
    """Test expense categories API without authentication"""
    print("\n🚫 Testing Expense Categories (No Auth)...")
    
    try:
        response = requests.get(f"{API_URL}/expense-categories")
        if response.status_code == 401:
            print("✅ Correctly rejected request without authentication")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def test_expense_categories_with_auth(token):
    """Test expense categories API with authentication"""
    print("\n✅ Testing Expense Categories (With Auth)...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test GET expense categories
        response = requests.get(f"{API_URL}/expense-categories", headers=headers)
        if response.status_code == 200:
            categories = response.json()
            print(f"✅ Successfully retrieved {len(categories)} expense categories")
            
            # Test creating a category
            category_data = {
                "name": "Test Category",
                "description": "A test category",
                "color": "#3B82F6"
            }
            
            create_response = requests.post(f"{API_URL}/expense-categories", 
                                          json=category_data, headers=headers)
            if create_response.status_code == 201:
                new_category = create_response.json()
                print(f"✅ Successfully created category: {new_category['name']}")
                
                # Test getting the specific category
                get_response = requests.get(f"{API_URL}/expense-categories/{new_category['id']}", 
                                          headers=headers)
                if get_response.status_code == 200:
                    print(f"✅ Successfully retrieved category: {new_category['name']}")
                    return True
                else:
                    print(f"❌ Failed to get specific category: {get_response.status_code}")
                    return False
            else:
                print(f"❌ Failed to create category: {create_response.status_code}")
                print(f"   Response: {create_response.text}")
                return False
        else:
            print(f"❌ Failed to get expense categories: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def test_api_path_structure():
    """Test API path structure consistency"""
    print("\n🔗 Testing API Path Structure...")
    
    # Test that the path structure is correct
    expected_paths = [
        "/api/health",
        "/api/auth/register", 
        "/api/auth/login",
        "/api/expense-categories"
    ]
    
    for path in expected_paths:
        try:
            response = requests.get(f"{BASE_URL}{path}")
            # We expect 401 for protected endpoints, but they should exist
            if response.status_code in [200, 401]:
                print(f"✅ Path exists: {path} (Status: {response.status_code})")
            else:
                print(f"❌ Unexpected status for {path}: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Path error {path}: {e}")
            return False
    
    return True

def main():
    """Run all tests"""
    print("🧪 Starting Complete Expense Categories API Test")
    print("=" * 60)
    
    # Test results
    results = {}
    
    # 1. Health check
    results['health'] = test_health_check()
    if not results['health']:
        print("\n❌ API is not healthy. Aborting tests.")
        return
    
    # 2. API path structure
    results['paths'] = test_api_path_structure()
    
    # 3. Test without auth (should fail)
    results['no_auth'] = test_expense_categories_without_auth()
    
    # 4. Test authentication
    token = test_user_login()
    if token:
        results['auth'] = True
        
        # 5. Test with auth (should work)
        results['with_auth'] = test_expense_categories_with_auth(token)
    else:
        results['auth'] = False
        results['with_auth'] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper():<15}: {status}")
    
    # Overall result
    all_passed = all(results.values())
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Expense Categories API is working correctly")
        print("✅ Authentication flow is working")
        print("✅ API path structure is correct")
    else:
        print("⚠️  SOME TESTS FAILED!")
        print("Please check the failed tests above")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
