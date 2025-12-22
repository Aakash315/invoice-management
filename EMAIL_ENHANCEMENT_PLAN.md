# Email Status Tracking Enhancement Plan

## Current Implementation Status ✅

### Already Implemented:
1. ✅ **Store sent Email status in invoice history** - EmailHistory model with status tracking
2. ✅ **Send History: Show email log on invoice page** - Email history table in InvoiceView.jsx
3. ✅ **Resend Option: Easy way to resend invoices** - Resend button and EmailComposeModal
4. ✅ **Delivery Status: Show if email was failed** - Basic failed/sent status tracking

### Current Status Types:
- `sent` - Email was successfully sent
- `failed` - Email sending failed with error message

## Enhancement Plan

### Information Gathered:
- **Database**: EmailHistory model exists with comprehensive fields
- **Backend**: Email sending and history tracking endpoints implemented
- **Frontend**: Email history display and resend functionality working
- **Mail Service**: FastMail integration with HTML templates

### Missing/To Enhance:
1. **Enhanced Delivery Status Tracking**
   - Add delivery confirmation tracking
   - Email open tracking
   - Bounce handling
   - More granular status states

2. **Email Delivery Confirmation System**
   - Tracking pixel for email opens
   - Webhook endpoints for delivery notifications
   - Enhanced status updates

3. **Status Improvements**
   - `pending` - Email queued for sending
   - `sent` - Email sent to provider
   - `delivered` - Email confirmed delivered to recipient
   - `opened` - Email opened by recipient
   - `bounced` - Email bounced back
   - `failed` - Sending failed

## Plan: Enhanced Email Status Tracking

### Step 1: Update Database Schema
**File**: `backend/app/models/email_history.py`
- Add delivery tracking fields
- Enhance status enum
- Add timestamp fields for delivery/open events

### Step 2: Update Backend APIs
**Files**: 
- `backend/app/routers/invoices.py` - Enhance email sending endpoints
- `backend/app/schemas/email_history.py` - Update response schemas
- Add new endpoints for delivery tracking

### Step 3: Enhanced Mail Service
**File**: `backend/app/utils/mail.py`
- Add tracking pixel support
- Delivery confirmation handling
- Enhanced error tracking

### Step 4: Frontend Improvements
**Files**:
- `frontend/src/components/invoices/InvoiceView.jsx` - Enhanced email history display
- `frontend/src/components/invoices/EmailComposeModal.jsx` - Support for resend with tracking

### Step 5: Tracking System Implementation
**Files**:
- Add tracking pixel endpoint
- Add webhook handlers for delivery notifications
- Update email templates with tracking

## Implementation Details

### Database Changes:
```sql
-- Add new fields to email_history table
ALTER TABLE email_history ADD COLUMN delivered_at TIMESTAMP;
ALTER TABLE email_history ADD COLUMN opened_at TIMESTAMP;
ALTER TABLE email_history ADD COLUMN bounced_at TIMESTAMP;
ALTER TABLE email_history ADD COLUMN delivery_error TEXT;
ALTER TABLE email_history ADD COLUMN tracking_id VARCHAR(100);
```

### Status Flow:
1. `pending` → Email queued
2. `sent` → Email sent to provider
3. `delivered` → Confirmed delivered
4. `opened` → Recipient opened email
5. `bounced` → Email bounced
6. `failed` → Sending failed

### Tracking Features:
- Unique tracking ID for each email
- 1x1 pixel for open tracking
- Webhook endpoints for delivery confirmation
- Enhanced error messages and retry logic

## Dependent Files to be Edited:
1. `backend/app/models/email_history.py`
2. `backend/app/schemas/email_history.py`
3. `backend/app/routers/invoices.py`
4. `backend/app/utils/mail.py`
5. `frontend/src/components/invoices/InvoiceView.jsx`
6. `frontend/src/components/invoices/EmailComposeModal.jsx`
7. New tracking endpoints (to be created)

## Followup Steps:
1. Test email sending with tracking
2. Verify email history display
3. Test resend functionality
4. Validate delivery status updates
5. Test tracking pixel implementation
6. Deploy and test in staging environment
