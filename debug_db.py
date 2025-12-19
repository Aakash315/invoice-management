import os
os.environ['DATABASE_URL'] = 'sqlite:///./invoice_system.db'
from app.database import SessionLocal
from app.models.invoice import Invoice

db = SessionLocal()
try:
    invoice = db.query(Invoice).first()
    if invoice:
        print(f'First invoice: {invoice.invoice_number}')
        print(f'Client ID: {invoice.client_id}')
        print(f'Client object: {invoice.client}')
        if invoice.client:
            print(f'Client name: {invoice.client.name}')
        else:
            print('No client relationship loaded')
    else:
        print('No invoices found')
finally:
    db.close()
