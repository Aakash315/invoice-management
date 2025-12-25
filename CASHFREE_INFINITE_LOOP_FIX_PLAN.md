# Cashfree Infinite Loop Fix Plan

## Problem Description
When `cashfreeorderid` is present in the URL, the page hits the verification API in an infinite loop, causing excessive API calls and poor user experience.

## Root Cause Analysis
1. **Recursive setTimeout Loop**: `verifyPaymentStatus()` calls itself indefinitely when status is "pending"
2. **No Retry Limits**: No maximum attempt counter to stop after certain tries
3. **URL Parameter Persistence**: `cashfree_order_id` stays in URL causing repeated useEffect triggers
4. **Missing State Management**: No proper tracking of verification in-progress state
5. **Poor Cleanup**: Timeouts and event listeners not properly cleaned up

## Solution Plan

### 1. Fix verifyPaymentStatus Function
- Add maximum retry limit (e.g., 10 attempts)
- Add verification in-progress flag
- Clear URL parameter after completion
- Add timeout cleanup
- Improve error handling

### 2. Fix useEffect Hook
- Add proper dependency array
- Add cleanup for URL parameter
- Prevent duplicate verification triggers
- Add verification state tracking

### 3. Add Utility Functions
- Function to clear URL parameters
- Function to get verification state
- Function to handle verification completion

### 4. Enhanced Error Handling
- Stop polling on network errors
- Stop polling on API errors
- Show user-friendly error messages
- Provide manual retry option

## Files to Modify
1. `/frontend/src/components/invoices/ClientInvoiceView.jsx` - Main component fix

## Expected Outcomes
- ✅ Eliminate infinite API calls
- ✅ Improve user experience with proper feedback
- ✅ Add automatic cleanup after successful/failed verification
- ✅ Provide manual retry options for failed cases
- ✅ Better error handling and logging

## Testing Checklist
- [ ] Payment completion (success scenario)
- [ ] Payment pending (should stop after max retries)
- [ ] Payment failed (should stop immediately)
- [ ] Network errors (should stop after max retries)
- [ ] Manual page refresh during verification
- [ ] Browser back/forward navigation
- [ ] Multiple rapid verification attempts
