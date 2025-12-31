import sqlite3
import os

# Check all db files
for db_file in ['invoice.db', 'invoicemgmt.db', 'invoice_management.db']:
    if os.path.exists(db_file):
        print(f'\nChecking {db_file}:')
        try:
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            print('Tables:', [t[0] for t in tables])
            if 'alembic_version' in [t[0] for t in tables]:
                cursor.execute('SELECT * FROM alembic_version')
                print('alembic_version:', cursor.fetchone())
            conn.close()
        except Exception as e:
            print(f'Error: {e}')

