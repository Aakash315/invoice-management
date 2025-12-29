# Invoice Templates & Customization Implementation Plan

## Overview
Implement a comprehensive invoice template system that allows users to create multiple professional invoice templates with different designs, layouts, and branding options.

## Current State Analysis
- ✅ Basic invoice system with PDF generation (jsPDF)
- ✅ Email functionality with HTML templates
- ✅ Recurring invoice templates (for automated generation)
- ❌ No invoice design templates
- ❌ Hardcoded PDF styling
- ❌ No branding customization options

## Implementation Plan

### Phase 1: Database Schema & Models
**Backend - Database Models**

1. **InvoiceTemplate Model** (`backend/app/models/invoice_template.py`)
   - Template ID, name, description
   - Company branding (logo, company name, address)
   - Color scheme (primary, secondary, accent colors)
   - Typography settings (font families, sizes)
   - Layout options (header style, item table style, totals layout)
   - Field visibility settings
   - Template styling (CSS configurations)

2. **InvoiceTemplateDefault Model** 
   - Track user's default template selection
   - Per-user template preferences

3. **Update Invoice Model**
   - Add `template_id` field to link invoices to design templates
   - Support template-specific invoice numbering if needed

### Phase 2: Backend API Development
**Backend - API Endpoints**

1. **Template CRUD Operations**
   - `GET /templates` - List all templates
   - `GET /templates/{id}` - Get specific template
   - `POST /templates` - Create new template
   - `PUT /templates/{id}` - Update template
   - `DELETE /templates/{id}` - Delete template

2. **Template Management**
   - `POST /templates/{id}/duplicate` - Duplicate template
   - `GET /templates/{id}/preview` - Generate preview data
   - `PUT /templates/default` - Set default template

3. **Integration Endpoints**
   - Update invoice creation to support template selection
   - Template-based PDF generation
   - Email template integration

### Phase 3: Frontend Template Management
**Frontend - Components**

1. **Template Gallery** (`frontend/src/components/templates/TemplateGallery.jsx`)
   - Visual preview of all available templates
   - Template selection interface
   - Create new template button

2. **Template Editor** (`frontend/src/components/templates/TemplateEditor.jsx`)
   - Visual template customization interface
   - Color picker components
   - Font selection dropdown
   - Layout options toggle switches
   - Field visibility controls

3. **Template Settings** (`frontend/src/components/templates/TemplateSettings.jsx`)
   - Company branding section (logo upload, company details)
   - Color scheme customization
   - Typography settings
   - Layout preferences

4. **Integration Updates**
   - Update InvoiceForm to include template selection
   - Add template preview in invoice creation
   - Template settings in user profile/settings

### Phase 4: PDF Generation Enhancement
**PDF Template Engine**

1. **Template-Based PDF Generation**
   - Update `pdfGenerator.js` to support template configurations
   - CSS-like styling for PDF elements
   - Template-specific layouts and designs

2. **Template Styles Implementation**
   - **Modern Template**: Clean, minimalist design with bold colors
   - **Classic Template**: Traditional business invoice with conservative colors
   - **Minimal Template**: Ultra-clean with lots of white space
   - **Corporate Template**: Professional, trust-inspiring design

3. **Dynamic Styling**
   - Color application based on template settings
   - Font family and size adjustments
   - Layout modifications (single/two-column, header styles)
   - Company branding integration

### Phase 5: Default Templates & User Experience
**Pre-built Templates**

1. **Default Template Library**
   - Create 4-5 pre-built professional templates
   - Template metadata and preview images
   - One-click template activation

2. **Template Selection UX**
   - Template gallery with live previews
   - Template comparison interface
   - Quick template switching

3. **Settings Integration**
   - Add template settings to user profile
   - Company branding integration
   - Default template selection

### Phase 6: Advanced Features
**Enhanced Functionality**

1. **Logo Management**
   - Logo upload and storage
   - Automatic resizing and optimization
   - Logo positioning options

2. **Advanced Customization**
   - Custom CSS injection for power users
   - Template export/import functionality
   - Brand kit integration

3. **Performance Optimization**
   - Template caching for faster PDF generation
   - Image optimization for logos
   - CDN integration for template assets

## Technical Architecture

### Backend Structure
```
backend/app/models/
├── invoice_template.py          # New: Template models
├── invoice.py                   # Update: Add template_id
└── ...

backend/app/routers/
├── templates.py                 # New: Template CRUD endpoints
├── invoices.py                  # Update: Template integration
└── ...

backend/app/utils/
├── template_renderer.py         # New: Template processing
├── pdf_generator.py            # Update: Template-based PDF
└── ...
```

### Frontend Structure
```
frontend/src/components/
├── templates/                   # New: Template components
│   ├── TemplateGallery.jsx
│   ├── TemplateEditor.jsx
│   ├── TemplateSettings.jsx
│   └── TemplatePreview.jsx
├── invoices/
│   ├── InvoiceForm.jsx          # Update: Template selection
│   ├── InvoiceView.jsx          # Update: Template info display
│   └── ...
└── ...
```

### Database Migration
```sql
-- New tables
CREATE TABLE invoice_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50), -- 'modern', 'classic', 'minimal', 'corporate'
    company_logo_url TEXT,
    company_name VARCHAR(255),
    company_address TEXT,
    color_primary VARCHAR(7),    -- Hex color
    color_secondary VARCHAR(7),
    color_accent VARCHAR(7),
    font_family VARCHAR(100),
    font_size_base INTEGER,
    header_style VARCHAR(50),
    item_table_style VARCHAR(50),
    totals_layout VARCHAR(50),
    show_invoice_number BOOLEAN DEFAULT true,
    show_issue_date BOOLEAN DEFAULT true,
    show_due_date BOOLEAN DEFAULT true,
    show_notes BOOLEAN DEFAULT true,
    show_terms BOOLEAN DEFAULT true,
    show_company_logo BOOLEAN DEFAULT true,
    show_client_details BOOLEAN DEFAULT true,
    custom_css TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_template_defaults (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    template_id INTEGER REFERENCES invoice_templates(id),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update invoices table
ALTER TABLE invoices ADD COLUMN template_id INTEGER REFERENCES invoice_templates(id);
```

## Implementation Timeline

### Week 1: Database & Models
- Create invoice template models
- Implement database migration
- Basic template CRUD operations

### Week 2: Backend API
- Template management endpoints
- PDF generation enhancement planning
- Basic frontend template components

### Week 3: Frontend Development
- Template gallery and editor
- Invoice form integration
- Template selection UI

### Week 4: PDF Enhancement & Testing
- Complete template-based PDF generation
- Default template creation
- Testing and bug fixes

### Week 5: Polish & Documentation
- Advanced features (logo upload, advanced customization)
- User documentation
- Performance optimization

## Success Metrics
- ✅ Users can create and customize invoice templates
- ✅ Multiple professional template options available
- ✅ Templates apply correctly to PDF generation
- ✅ Template selection works seamlessly in invoice creation
- ✅ Company branding integration works
- ✅ Fast template switching and management

## Risk Mitigation
- **Complexity**: Start with basic templates, add advanced features iteratively
- **Performance**: Implement template caching and optimize PDF generation
- **User Experience**: Provide intuitive template customization with visual previews
- **Backward Compatibility**: Ensure existing invoices continue to work with default template
