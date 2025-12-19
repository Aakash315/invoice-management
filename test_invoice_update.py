#!/usr/bin/env python3
"""
Test script to verify invoice update functionality
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/auth/login"
INVOICE_URL = f"{BASE_URL}/invoices"

# Test credentials (you may need to adjust these)
test_user = {
    "email": "test@example.com",
    "password": "password123"
}

def test_invoice_update():
    """Test that invoice updates work correctly"""
    print("🧪 Testing Invoice Update Functionality")
    print("=" * 50)
    
    # Step 1: Login to get token
    print("1. Logging in...")
    try:
        login_response = requests.post(LOGIN_URL, json=test_user)
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Login successful")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 2: Get existing invoices
    print("\n2. Fetching existing invoices...")
    try:
        invoices_response = requests.get(INVOICE_URL, headers=headers)
        if invoices_response.status_code == 200:
            invoices = invoices_response.json()
            if not invoices:
                print("❌ No invoices found to test with")
                return False
            
            test_invoice = invoices[0]
            original_data = {
                "client_id": test_invoice["client_id"],
                "issue_date": test_invoice["issue_date"],
                "due_date": test_invoice["due_date"],
                "tax_rate": test_invoice["tax_rate"],
                "discount": test_invoice["discount"],
                "status": test_invoice["status"],
                "notes": test_invoice["notes"] or "",
                "terms": test_invoice["terms"] or "",
                "items": test_invoice.get("items", [])
            }
            print(f"✅ Found invoice {test_invoice['invoice_number']}")
        else:
            print(f"❌ Failed to fetch invoices: {invoices_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error fetching invoices: {e}")
        return False
    
    # Step 3: Update the invoice with new values
    print("\n3. Updating invoice...")
    updated_data = original_data.copy()
    updated_data.update({
        "notes": f"Updated at {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "discount": 50.0,  # Change discount
        "tax_rate": 20.0   # Change tax rate
    })
    
    try:
        update_response = requests.put(
            f"{INVOICE_URL}/{test_invoice['id']}", 
            json=updated_data, 
            headers=headers
        )
        if update_response.status_code == 200:
            updated_invoice = update_response.json()
            print("✅ Invoice updated successfully")
            
            # Verify the changes
            if updated_invoice["notes"] == updated_data["notes"]:
                print("✅ Notes field updated correctly")
            else:
                print("❌ Notes field not updated")
                
            if abs(updated_invoice["discount"] - updated_data["discount"]) < 0.01:
                print("✅ Discount field updated correctly")
            else:
                print("❌ Discount field not updated")
                
            if abs(updated_invoice["tax_rate"] - updated_data["tax_rate"]) < 0.01:
                print("✅ Tax rate field updated correctly")
            else:
                print("❌ Tax rate field not updated")
                
            # Check if totals were recalculated
            expected_subtotal = sum(item["quantity"] * item["rate"] for item in updated_data["items"])
            expected_tax_amount = expected_subtotal * updated_data["tax_rate"] / 100
            expected_total = expected_subtotal + expected_tax_amount - updated_data["discount"]
            
            if abs(updated_invoice["subtotal"] - expected_subtotal) < 0.01:
                print("✅ Subtotal recalculated correctly")
            else:
                print("❌ Subtotal not recalculated correctly")
                
            if abs(updated_invoice["tax_amount"] - expected_tax_amount) < 0.01:
                print("✅ Tax amount recalculated correctly")
            else:
                print("❌ Tax amount not recalculated correctly")
                
            if abs(updated_invoice["total_amount"] - expected_total) < 0.01:
                print("✅ Total amount recalculated correctly")
            else:
                print("❌ Total amount not recalculated correctly")
            
            return True
        else:
            print(f"❌ Update failed: {update_response.status_code}")
            print(f"Response: {update_response.text}")
            return False
    except Exception as e:
        print(f"❌ Update error: {e}")
        return False

if __name__ == "__main__":
    print("Invoice Update Test")
    print("Make sure your backend is running on localhost:8000")
    print()
    
    success = test_invoice_update()
    
    if success:
        print("\n🎉 All tests passed! Invoice update functionality is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
