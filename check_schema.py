#!/usr/bin/env python3
import sqlite3

# Connect to the database
conn = sqlite3.connect('backend/invoicemgmt.db')
cursor = conn.cursor()

# Get the schema of email_history table
cursor.execute("PRAGMA table_info(email_history)")
columns = cursor.fetchall()

print("Current columns in email_history table:")
for col in columns:
    nullable = 'NULL' if col[3] == 0 else 'NOT NULL'
    print(f"  {col[1]} ({col[2]}) - {nullable}")

# Get expected columns from Python model
expected_columns = [
    'delivered_at', 'opened_at', 'bounced_at', 'delivery_error', 
    'tracking_id', 'sent_to'
]

current_columns = [col[1] for col in columns]
missing_columns = [col for col in expected_columns if col not in current_columns]

print(f"\nMissing columns: {missing_columns}")

conn.close()
