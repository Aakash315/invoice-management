#!/usr/bin/env python3
"""
Test script to verify the template_id fixes are working correctly.
This script tests the critical paths where Invoice.template_id was used incorrectly.
"""

import sys
import os
sys.path.append('/Users/sozoadmin/Aakash/invoice-management/backend')

def test_imports():
    """Test that all imports work correctly."""
    try:
        from app.models.invoice import Invoice
        from app.models.recurring_invoice import RecurringInvoice
        from app.models.invoice_template import InvoiceTemplate
        print("✅ All imports successful")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_model_attributes():
    """Test that Invoice model has the correct attributes."""
    try:
        from app.models.invoice import Invoice
        
        # Check for correct attributes
        if hasattr(Invoice, 'recurring_template_id'):
            print("✅ Invoice.recurring_template_id exists")
        else:
            print("❌ Invoice.recurring_template_id missing")
            return False
            
        if hasattr(Invoice, 'design_template_id'):
            print("✅ Invoice.design_template_id exists")
        else:
            print("❌ Invoice.design_template_id missing")
            return False
            
        # Check that template_id doesn't exist
        if not hasattr(Invoice, 'template_id'):
            print("✅ Invoice.template_id correctly removed")
        else:
            print("❌ Invoice.template_id still exists (should be removed)")
            return False
            
        return True
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

def test_query_syntax():
    """Test that the corrected query syntax would work."""
    try:
        from app.models.invoice import Invoice
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        # Create in-memory database for testing
        engine = create_engine('sqlite:///:memory:')
        Invoice.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        db = Session()
        
        # Test the corrected query syntax
        # This would have failed with the old template_id attribute
        invoices = db.query(Invoice).filter(
            Invoice.recurring_template_id == 1  # This should work now
        ).all()
        
        invoices = db.query(Invoice).filter(
            Invoice.design_template_id == 1  # This should work now
        ).all()
        
        db.close()
        print("✅ Query syntax tests passed")
        return True
    except Exception as e:
        print(f"❌ Query test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("Testing Template ID Fix Implementation")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_model_attributes, 
        test_query_syntax
    ]
    
    passed = 0
    for test in tests:
        print(f"\nRunning {test.__name__}...")
        if test():
            passed += 1
    
    print(f"\n{'=' * 50}")
    print(f"Tests passed: {passed}/{len(tests)}")
    
    if passed == len(tests):
        print("🎉 All tests passed! Template ID fix is working correctly.")
        return True
    else:
        print("❌ Some tests failed. Please check the fixes.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
