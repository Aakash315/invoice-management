#!/usr/bin/env python3
import sqlite3

# Connect to the database
conn = sqlite3.connect('invoicemgmt.db')
cursor = conn.cursor()

# Check what status values are in the database
cursor.execute("SELECT DISTINCT status FROM email_history WHERE status IS NOT NULL")
status_values = cursor.fetchall()

print("Current status values in database:")
for status in status_values:
    print(f"  '{status[0]}'")

# Check for any NULL or problematic values
cursor.execute("SELECT COUNT(*) FROM email_history WHERE status IS NULL")
null_count = cursor.fetchone()[0]
print(f"\nNumber of NULL status values: {null_count}")

# Check total rows
cursor.execute("SELECT COUNT(*) FROM email_history")
total_count = cursor.fetchone()[0]
print(f"Total rows: {total_count}")

conn.close()
