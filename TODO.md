# Invoice Templates Implementation TODO

## Phase 1: Database Schema & Models ✅ IN PROGRESS

### Backend Models
- [ ] Create InvoiceTemplate model (`backend/app/models/invoice_template.py`)
- [ ] Create UserTemplateDefault model
- [ ] Update Invoice model to include template_id field
- [ ] Create database migration for new tables
- [ ] Create schema models for API responses (`backend/app/schemas/invoice_template.py`)
- [ ] Update models/__init__.py to include new models

### Database Migration
- [ ] Create migration file for invoice templates tables
- [ ] Add template_id column to existing invoices table
- [ ] Create user_template_defaults table
- [ ] Add foreign key relationships

## Phase 2: Backend API Development

### Template CRUD Operations
- [ ] Create templates router (`backend/app/routers/templates.py`)
- [ ] Implement GET /templates endpoint
- [ ] Implement GET /templates/{id} endpoint  
- [ ] Implement POST /templates endpoint
- [ ] Implement PUT /templates/{id} endpoint
- [ ] Implement DELETE /templates/{id} endpoint

### Template Management
- [ ] POST /templates/{id}/duplicate endpoint
- [ ] GET /templates/{id}/preview endpoint
- [ ] PUT /templates/default endpoint
- [ ] Integration with invoice creation

### PDF Enhancement
- [ ] Update pdf generator to support templates
- [ ] Create template renderer utility
- [ ] Implement template-based styling

## Phase 3: Frontend Template Management

### Template Components
- [ ] Create TemplateGallery component
- [ ] Create TemplateEditor component
- [ ] Create TemplateSettings component
- [ ] Create TemplatePreview component

### Services & API
- [ ] Create templateService.js
- [ ] Update API service for template endpoints
- [ ] Add template state management

### Integration Updates
- [ ] Update InvoiceForm to include template selection
- [ ] Update InvoiceView to display template info
- [ ] Add template settings to user profile

## Phase 4: Template Implementation

### Default Templates
- [ ] Create Modern template configuration
- [ ] Create Classic template configuration
- [ ] Create Minimal template configuration
- [ ] Create Corporate template configuration

### PDF Template Engine
- [ ] Implement template-based PDF generation
- [ ] Add color scheme support
- [ ] Add font family support
- [ ] Add layout customization

## Phase 5: Advanced Features

### Logo Management
- [ ] Logo upload functionality
- [ ] Logo storage and retrieval
- [ ] Logo positioning options

### Advanced Customization
- [ ] Field visibility controls
- [ ] Custom CSS support
- [ ] Template export/import

### User Experience
- [ ] Template gallery with live previews
- [ ] Template comparison interface
- [ ] Quick template switching

## Testing & Polish

### Testing
- [ ] Backend API testing
- [ ] Frontend component testing
- [ ] PDF generation testing
- [ ] Template integration testing

### Documentation
- [ ] User documentation for template features
- [ ] Developer documentation for template system
- [ ] API documentation updates

## Implementation Status: STARTING PHASE 1

**Current Step:** Creating InvoiceTemplate model and database migration
**Next Step:** Database migration execution and backend API implementation
