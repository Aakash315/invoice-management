# Net Profit Dashboard Fix Plan

## Problem Analysis
The Net Profit section in the Invoice Management Dashboard is showing value 0 instead of the actual profit amount.

## Root Cause Identification
After analyzing the codebase, I've identified several potential issues:

1. **Data Flow Issues**: The profit data from `expenseService.getProfitDashboard()` may not be properly fetched or processed
2. **Currency Handling**: The StatsCard component may not be displaying the currency symbol correctly
3. **Backend Calculation**: The profit calculation in the backend may have issues with database queries
4. **Error Handling**: The frontend may be falling back to default values when the API call fails

## Files to Examine and Fix

### Backend Files
1. `backend/app/routers/dashboard.py` - Dashboard API endpoints
2. `backend/app/utils/profit_calculator.py` - Profit calculation logic
3. `backend/app/models/invoice.py` - Invoice model
4. `backend/app/models/expense.py` - Expense model

### Frontend Files  
1. `frontend/src/components/dashboard/Dashboard.jsx` - Main dashboard component
2. `frontend/src/components/dashboard/StatsCard.jsx` - Stats display component
3. `frontend/src/services/expenseService.js` - API service for profit data

## Detailed Fix Plan

### Step 1: Backend Data Verification
- [ ] Check if `/dashboard/profit` endpoint is working correctly
- [ ] Verify profit calculation logic in `profit_calculator.py`
- [ ] Test database queries for revenue and expense data
- [ ] Ensure proper currency handling in calculations

### Step 2: Frontend Data Flow Fix
- [ ] Fix the profit data fetching in Dashboard.jsx
- [ ] Ensure proper error handling and fallback values
- [ ] Verify currency display logic in StatsCard.jsx
- [ ] Add proper loading states for profit data

### Step 3: Currency Display Fix
- [ ] Add missing currency icons to StatsCard.jsx
- [ ] Ensure consistent currency reference across components
- [ ] Fix currency symbol mapping for different currencies

### Step 4: Testing and Validation
- [ ] Test profit calculation with sample data
- [ ] Verify currency display works correctly
- [ ] Ensure responsive behavior
- [ ] Test edge cases (no data, negative profit, etc.)

## Expected Outcome
- Net Profit section displays actual profit value instead of 0
- Proper currency symbol is displayed
- Error handling prevents crashes
- Loading states provide better UX

## Implementation Priority
1. **High Priority**: Fix backend profit calculation and API response
2. **Medium Priority**: Fix frontend data flow and error handling  
3. **Medium Priority**: Fix currency display issues
4. **Low Priority**: Add enhanced error handling and loading states
