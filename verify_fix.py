#!/usr/bin/env python3
import sqlite3

# Connect to the database (correct path as per DATABASE_URL)
conn = sqlite3.connect('invoicemgmt.db')
cursor = conn.cursor()

# Check if table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='email_history'")
table_exists = cursor.fetchone()

if table_exists:
    print("✅ email_history table exists")
    
    # Get the schema of email_history table
    cursor.execute("PRAGMA table_info(email_history)")
    columns = cursor.fetchall()
    
    print("\nCurrent columns in email_history table:")
    for col in columns:
        nullable = 'NULL' if col[3] == 0 else 'NOT NULL'
        default = f" (default: {col[4]})" if col[4] else ""
        print(f"  ✅ {col[1]} ({col[2]}) - {nullable}{default}")
    
    # Check for the specific columns that were missing
    current_columns = [col[1] for col in columns]
    
    expected_columns = [
        'delivered_at', 'opened_at', 'bounced_at', 'delivery_error', 
        'tracking_id', 'sent_to'
    ]
    
    print(f"\nChecking for previously missing columns:")
    missing_count = 0
    for col in expected_columns:
        if col in current_columns:
            print(f"  ✅ {col} - NOW EXISTS")
        else:
            print(f"  ❌ {col} - STILL MISSING")
            missing_count += 1
    
    if missing_count == 0:
        print(f"\n🎉 SUCCESS: All previously missing columns are now present!")
    else:
        print(f"\n❌ Still missing {missing_count} columns")
        
    # Check if there are any rows
    cursor.execute("SELECT COUNT(*) FROM email_history")
    row_count = cursor.fetchone()[0]
    print(f"\nNumber of rows in email_history: {row_count}")
else:
    print("❌ email_history table does not exist")

conn.close()
