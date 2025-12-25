# Plan: Fix API Path Duplication Issue

## Problem Analysis
The error shows a duplicated API path: `/api/api/client-auth/token` instead of the correct `/api/client-auth/token`. This indicates that the base API path `/api` is being duplicated somewhere in the frontend configuration.

## Root Cause
1. **Backend Configuration**: In `backend/app/main.py`, all routers are included with `prefix="/api"`
2. **Router Configuration**: In `backend/app/routers/client_auth.py`, the router has its own prefix `/client-auth`
3. **Frontend Issue**: In `frontend/src/services/clientAuthService.js`, the API calls include `/api` in the endpoint path

This results in: `/api` (from main.py) + `/api/client-auth/token` (from frontend) = `/api/api/client-auth/token`

## Solution
Remove the `/api` prefix from all frontend API service calls since the backend already includes this prefix when mounting routers.

## Files to Fix

### Frontend Services
1. `frontend/src/services/clientAuthService.js` - Remove `/api` prefix from all endpoints
2. `frontend/src/services/api.js` - Ensure consistent API URL configuration

### Verification
3. Check other service files for similar issues
4. Test the fix by making API calls

## Expected Result
- Client authentication will work correctly
- API calls will resolve to the correct paths
- No more 404 errors due to path duplication

## Next Steps
1. Fix `clientAuthService.js`
2. Check other service files
3. Test the fix
4. Verify all API endpoints work correctly
