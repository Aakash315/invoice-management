# Recurring Invoices Frontend Enhancement Plan

## Current Status
- ✅ Backend implementation complete (Phases 1 & 2)
- ✅ Core frontend components complete (RecurringInvoiceList, RecurringInvoiceForm, RecurringInvoiceView)
- ❌ Integration with existing invoice components missing (Phases 3.6 & 4)

## Phase 3.6: Enhance Existing Components with Recurring Features

### 3.6.1: Create RecurringBadge Component
**File:** `frontend/src/components/common/RecurringBadge.jsx`
- Purpose: Visual indicator for invoices generated from recurring templates
- Features: Shows template name, recurrence frequency, generated timestamp
- Styling: Small, elegant badge with recurring icon

### 3.6.2: Enhance InvoiceList Component
**File:** `frontend/src/components/invoices/InvoiceList.jsx`
**Enhancements:**
- Add recurring indicators to invoice rows
- Add filter for "Recurring vs Manual" invoices  
- Show template info in client column when applicable
- Add action button to view template from invoice

### 3.6.3: Enhance InvoiceView Component  
**File:** `frontend/src/components/invoices/InvoiceView.jsx`
**Enhancements:**
- Add "Generated from Template" section showing template details
- Add link to view the original recurring template
- Show recurrence pattern and next due date
- Add "Create Similar Template" action

## Phase 4: UI/UX Enhancements

### 4.1: Add Recurring Badge Component
**File:** `frontend/src/components/common/RecurringBadge.jsx`
- Reusable component for showing recurring invoice indicators
- Props: template name, frequency, generated date, click handler
- Styling: Consistent with app design system

### 4.2: Enhance Invoice List with Recurring Indicators
**File:** `frontend/src/components/invoices/InvoiceList.jsx`
**Features:**
- Recurring badges in invoice number column
- "Generated from template" indicators
- Filter toggle: All / Manual / Recurring
- Sort by: Template name, recurrence date

### 4.4: Add Preview Functionality for Upcoming Invoices
**Implementation:** Add preview modal/section showing next upcoming invoices
- Show in RecurringInvoiceView (existing)
- Add to RecurringInvoiceList as tooltip or modal
- Quick preview of next 3-5 due dates

### 4.3: Update Invoice View to Show Template Info
**File:** `frontend/src/components/invoices/InvoiceView.jsx`
**New Sections:**
- "Template Information" card
- "Recurrence Pattern" details  
- "Next Invoice" preview
- Action buttons: View Template, Pause Template, Edit Template

## Implementation Steps

### Step 1: Create RecurringBadge Component
- [ ] Create `frontend/src/components/common/RecurringBadge.jsx`
- [ ] Style with proper responsive design
- [ ] Add TypeScript definitions if needed

### Step 2: Enhance InvoiceList
- [ ] Import and use RecurringBadge component
- [ ] Add recurring filter options
- [ ] Update table structure for template info
- [ ] Add template action buttons

### Step 3: Enhance InvoiceView
- [ ] Add template information section
- [ ] Show recurrence pattern and next dates
- [ ] Add template action buttons
- [ ] Update styling and layout

### Step 4: Add Preview Functionality
- [ ] Enhance existing preview in RecurringInvoiceView
- [ ] Add quick preview to RecurringInvoiceList
- [ ] Implement tooltip or modal for upcoming dates

### Step 5: Testing & Polish
- [ ] Test all new components
- [ ] Verify responsive design
- [ ] Check accessibility
- [ ] Update TODO status

## Expected Outcome
- Seamless integration between regular invoices and recurring templates
- Clear visual indicators for recurring invoices
- Easy navigation between invoices and their templates
- Enhanced user experience for managing recurring billing

## Files to be Modified
1. `frontend/src/components/common/RecurringBadge.jsx` (NEW)
2. `frontend/src/components/invoices/InvoiceList.jsx` (ENHANCE)
3. `frontend/src/components/invoices/InvoiceView.jsx` (ENHANCE)
4. `frontend/src/components/invoices/RecurringInvoiceList.jsx` (ENHANCE)
5. `frontend/src/components/invoices/RecurringInvoiceView.jsx` (ENHANCE)
