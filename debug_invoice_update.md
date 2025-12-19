# Invoice Update Issue Analysis

## Problem Summary
When updating an invoice in the invoice list page, changes are not being detected after clicking the "Update Invoice" button.

## Root Causes Identified

### 1. **Backend Update Logic Issue**
In `backend/app/routers/invoices.py`, the `update_invoice` function only updates a subset of fields:

```python
# Current implementation - INCOMPLETE
if invoice_data.status:
    invoice.status = invoice_data.status
if invoice_data.notes is not None:
    invoice.notes = invoice_data.notes
if invoice_data.terms is not None:
    invoice.terms = invoice_data.terms
```

**Missing fields that should be updated:**
- `client_id`
- `issue_date` 
- `due_date`
- `tax_rate`
- `discount`

### 2. **Frontend State Management Issue**
In `InvoiceList.jsx`, the component relies on `location.state?.refresh` to detect when returning from form:

```javascript
const justReturnedFromForm = location.state?.refresh;
```

**Problems:**
- React Router state might not persist reliably
- The refresh flag might get cleared during navigation
- Component doesn't automatically re-fetch when returning

### 3. **Data Propagation Gap**
- Frontend sends complete form data including dates, client, tax_rate, discount
- Backend only processes status, notes, terms, and items
- Missing field updates are silently ignored

## Impact
- Invoice updates appear to "succeed" (user gets success message)
- Changes are not actually saved to database
- User sees no changes reflected in the list
- Creates confusion and poor user experience

## Solution Required
1. Fix backend update logic to handle all form fields
2. Improve frontend state management for better refresh detection
3. Add proper error handling and validation
