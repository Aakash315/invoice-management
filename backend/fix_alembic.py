import sqlite3

# Connect to the database
conn = sqlite3.connect('invoice_management.db')
cursor = conn.cursor()

# Check current alembic version
cursor.execute('SELECT * FROM alembic_version')
result = cursor.fetchone()
print('Current alembic_version:', result)

# Update to the final_merge_heads revision
cursor.execute('DELETE FROM alembic_version')
cursor.execute("INSERT INTO alembic_version (version_num) VALUES ('final_merge_heads')")
conn.commit()

# Verify
cursor.execute('SELECT * FROM alembic_version')
print('Updated alembic_version:', cursor.fetchone())

conn.close()
print('Done!')

