# Database Schema Fix Plan

## Problem Analysis
The `email_history` table in the database is missing several columns that the Python `EmailHistory` model expects, causing SQLAlchemy to fail when trying to query the table.

## Missing Columns
Based on the Python model (`backend/app/models/email_history.py`), these columns are missing:
- `delivered_at` - DateTime(timezone=True), nullable=True
- `opened_at` - DateTime(timezone=True), nullable=True  
- `bounced_at` - DateTime(timezone=True), nullable=True
- `delivery_error` - Text, nullable=True
- `tracking_id` - String(100), unique, nullable=True
- `sent_to` - String(255), nullable=True
- `cc` - Text, nullable=True
- `bcc` - Text, nullable=True
- `body_preview` - Text, nullable=True
- `attachment_filename` - String(255), nullable=True

## Solution
Create a new Alembic migration that adds all missing columns to the `email_history` table.

## Files to Modify
1. **Create new migration**: `backend/alembic/versions/fix_email_history_schema.py`
2. **Test the fix**: Run migration and verify the API works

## Steps
1. Create comprehensive migration file
2. Run alembic upgrade to apply changes
3. Test the `/api/invoices/4/email-history` endpoint
4. Verify no more SQL errors

## Expected Outcome
- Database schema matches Python model
- Email history API endpoints work correctly
- No more "no such column" errors
