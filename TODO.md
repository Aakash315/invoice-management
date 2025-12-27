# React Infinite Loop Fix - TODO

## Phase 1: Fix InvoiceList.jsx Circular Dependencies

### Step 1: Identify and fix circular dependency in InvoiceList.jsx
- [x] Analyze the current implementation
- [x] Create brainstorm plan
- [x] Fix the circular dependency between `justUpdated`, `justReturnedFromForm`, and useEffect hooks
- [x] Simplify the state management approach
- [x] Test the changes

### Step 2: Review InvoiceView.jsx for optimization opportunities
- [ ] Review useCallback dependencies
- [ ] Check useApi hook integration
- [ ] Optimize component re-renders

### Step 3: Testing & Validation
- [ ] Test invoice list navigation
- [ ] Test clicking on invoices
- [ ] Verify no console errors
- [ ] Ensure proper functionality

## Implementation Details

### Current Issue in InvoiceList.jsx:
```javascript
// Circular dependency detected:
const justReturnedFromForm = location.state?.refresh || justUpdated;

useEffect(() => {
  const invoiceUpdated = sessionStorage.getItem('invoiceUpdated');
  if (invoiceUpdated === 'true') {
    setJustUpdated(true);
    sessionStorage.removeItem('invoiceUpdated');
  }
}, []);

useEffect(() => {
  fetchInvoices();
}, [filters, justReturnedFromForm]); // This causes infinite loop

// Cleanup effect to reset justUpdated flag after use
useEffect(() => {
  if (justUpdated) {
    setJustUpdated(false); // This causes re-render which triggers previous useEffect
  }
}, [justUpdated]);
```

### Proposed Fix:
Replace the circular dependency with a simpler approach using sessionStorage directly in the effect that calls fetchInvoices.
