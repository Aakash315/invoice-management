# Fix ResponseValidationError in Clients Endpoint

## Issue Analysis
The error `{'loc': ('response', 0), 'msg': 'value is not a valid dict', 'type': 'type_error.dict'}` occurs because:
- The `Client` model has relationships (`created_by_user`, `invoices`) that get loaded with the query
- The `ClientResponse` schema doesn't exclude these relationships
- Pydantic tries to validate the entire object including relationships, causing validation failure

## Solution Plan
1. **Update ClientResponse schema** to exclude relationship fields using Pydantic's `exclude` parameter
2. **Test the fix** to ensure the endpoint works correctly

## Files to Modify
- `backend/app/schemas/client.py` - Update ClientResponse schema to exclude relationships

## Expected Outcome
- GET /api/clients endpoint should return valid JSON responses
- No more ResponseValidationError
