# Recurring Invoices Implementation Plan

## Overview
Implement a comprehensive recurring invoices system that allows users to create invoice templates with automatic generation schedules, supporting daily, weekly, monthly, quarterly, and yearly frequencies.

## Current System Analysis
- **Backend**: FastAPI with SQLAlchemy models
- **Frontend**: React with service-based architecture
- **Database**: Existing tables for invoices, clients, email history
- **Email System**: Already implemented with tracking capabilities
- **Authentication**: User-based access control

## Implementation Plan

### Phase 1: Database Schema & Models

#### 1.1 New Database Table: recurring_invoices
```sql
- id (Primary Key)
- template_name (String)
- client_id (Foreign Key)
- frequency (Enum: daily, weekly, monthly, quarterly, yearly)
- interval_value (Integer, default: 1) - for "every N days/weeks/months"
- day_of_week (Integer, for weekly frequency)
- day_of_month (Integer, for monthly frequency)
- start_date (Date)
- end_date (Date, optional)
- occurrences_limit (Integer, optional)
- current_occurrence (Integer, default: 0)
- is_active (Boolean, default: True)
- auto_send (Boolean, default: False)
- email_subject (String, optional)
- email_message (String, optional)
- created_by (Foreign Key)
- created_at (DateTime)
- updated_at (DateTime)
- last_generated_at (DateTime, optional)
- next_due_date (Date)
```

#### 1.2 New Model: RecurringInvoiceTemplate
- SQLAlchemy model with relationships
- Link to Client, User models
- Support for invoice item templates
- Date calculation methods

#### 1.3 Schema Models
- RecurringInvoiceCreate, RecurringInvoiceUpdate
- RecurringInvoiceResponse
- RecurringInvoiceListResponse

### Phase 2: Backend Implementation

#### 2.1 Core Business Logic
- Date calculation utilities for different frequencies
- Template to invoice conversion logic
- Recurrence rule engine
- Automatic invoice numbering for generated invoices

#### 2.2 New API Endpoints
```
POST /api/recurring-invoices/          # Create template
GET  /api/recurring-invoices/          # List templates
GET  /api/recurring-invoices/{id}      # Get template
PUT  /api/recurring-invoices/{id}      # Update template
DELETE /api/recurring-invoices/{id}    # Delete template
POST /api/recurring-invoices/{id}/toggle  # Pause/Resume
GET  /api/recurring-invoices/{id}/preview  # Preview next dates
GET  /api/recurring-invoices/{id}/history  # Generated invoices history
POST /api/recurring-invoices/generate     # Manual generation trigger
```

#### 2.3 Background Job System
- Cron job or scheduled task for daily checks
- Automatic generation logic
- Email sending integration
- Error handling and logging
- Status tracking for generated invoices

#### 2.4 Router Implementation
- New router: recurring_invoices.py
- Integration with existing invoice creation
- Authentication and permission checks
- Validation and error handling

### Phase 3: Frontend Implementation

#### 3.1 New Components
- **RecurringInvoiceList**: Template management page
- **RecurringInvoiceForm**: Create/edit template
- **RecurringInvoiceView**: Template details with history
- **RecurringBadge**: UI indicator for recurring invoices

#### 3.2 Enhanced Components
- **InvoiceList**: Add recurring invoice badges
- **InvoiceView**: Show if invoice was generated from template
- **InvoiceForm**: Option to save as template

#### 3.3 New Pages/Routes
- `/recurring-invoices` - List all templates
- `/recurring-invoices/new` - Create template
- `/recurring-invoices/edit/:id` - Edit template
- `/recurring-invoices/view/:id` - Template details

#### 3.4 Services
- `recurringInvoiceService.js` with API methods
- Integration with existing invoice service

### Phase 4: Advanced Features

#### 4.1 Frequency Options Implementation
- **Daily**: Every N days with date validation
- **Weekly**: Specific day(s) of week with interval
- **Monthly**: Day of month (1st, 15th, last day, custom)
- **Quarterly**: Every 3 months on specific date
- **Yearly**: Same date each year

#### 4.2 Template Management
- Duplicate templates
- Bulk operations
- Import/export templates
- Template categories

#### 4.3 Email Integration
- Auto-send generated invoices
- Custom email templates per template
- Email preview before activation
- Notification settings

#### 4.4 History & Analytics
- Track all generated invoices
- Success/failure rates
- Next generation preview
- Usage statistics

### Phase 5: UI/UX Enhancements

#### 5.1 Visual Indicators
- Recurring badge on invoice lists
- Template status indicators
- Progress indicators for next generations
- Color-coded frequency types

#### 5.2 User Experience
- Intuitive template creation wizard
- Quick preview of upcoming invoices
- Bulk actions for template management
- Mobile-responsive design

### Phase 6: Background Job System

#### 6.1 Scheduling Options
- Daily cron job for template checking
- Configurable generation times
- Priority handling for templates
- Retry mechanisms for failures

#### 6.2 Monitoring & Logging
- Generation success/failure tracking
- Email delivery monitoring
- Template performance metrics
- Error reporting and alerts

### Phase 7: Testing & Validation

#### 7.1 Backend Testing
- Unit tests for date calculations
- Integration tests for API endpoints
- Background job testing
- Email delivery validation

#### 7.2 Frontend Testing
- Component testing with Jest/React Testing Library
- API integration testing
- User flow testing
- Responsive design testing

### Phase 8: Migration & Deployment

#### 8.1 Database Migration
- Create recurring_invoices table
- Add indexes for performance
- Data migration scripts if needed

#### 8.2 Configuration Updates
- Environment variables for scheduling
- Email service configuration
- Logging configuration

#### 8.3 Deployment Checklist
- Database migration execution
- Background job setup
- Environment configuration
- Performance optimization

## Technical Implementation Details

### Date Calculation Logic
```python
def calculate_next_date(current_date, frequency, interval, day_of_week=None, day_of_month=None):
    # Implementation for different frequency types
    pass
```

### Template to Invoice Conversion
```python
def create_invoice_from_template(template_id, generation_date):
    # Copy template data to create new invoice
    # Update invoice numbering
    # Link to template
    pass
```

### Background Job Integration
```python
async def check_recurring_invoices():
    # Daily task to check for due templates
    # Generate invoices when needed
    # Send emails if auto-send is enabled
    pass
```

## Expected Benefits
1. **Time Saving**: Eliminate manual invoice creation for repetitive billing
2. **Consistency**: Ensure consistent invoice format and amounts
3. **Reliability**: Automated reminders for due invoices
4. **Scalability**: Handle growing number of recurring clients efficiently
5. **Revenue Protection**: Prevent missed invoices due to manual oversight

## Risk Mitigation
1. **Backup Generation**: Manual trigger option as backup
2. **Error Handling**: Comprehensive logging and retry mechanisms
3. **Testing**: Thorough testing before production deployment
4. **Monitoring**: Real-time tracking of generation status

## Success Metrics
- Number of active recurring templates
- Success rate of automatic generation
- Time saved per month
- Reduction in manual invoice creation
- User adoption rate

## Timeline Estimate
- **Phase 1-2**: Database & Backend (2-3 weeks)
- **Phase 3**: Frontend Components (2-3 weeks)
- **Phase 4**: Advanced Features (1-2 weeks)
- **Phase 5**: UI/UX Polish (1 week)
- **Phase 6-8**: Background Jobs, Testing, Deployment (1-2 weeks)

**Total Estimated Time**: 7-11 weeks

## Next Steps
1. User approval of this plan
2. Database schema creation and migration
3. Backend API development
4. Frontend component development
5. Testing and deployment

---

This plan provides a comprehensive roadmap for implementing the recurring invoices feature while maintaining the system's existing functionality and adding robust automation capabilities.
