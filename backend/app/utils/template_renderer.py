from sqlalchemy.orm import Session
from typing import Optional
from app.models.invoice_template import InvoiceTemplate

class TemplateRenderer:
    def __init__(self, template: Optional[InvoiceTemplate]):
        self.template = template
    
    def get_template_config(self) -> dict:
        """Get template configuration with defaults if no template is provided"""
        if not self.template:
            return self.get_default_config()
        
        return {
            # Colors
            'primary_color': self.template.color_primary or "#2563eb",
            'secondary_color': self.template.color_secondary or "#6b7280", 
            'accent_color': self.template.color_accent or "#10b981",
            'text_color': self.template.color_text or "#111827",
            'background_color': self.template.color_background or "#ffffff",
            
            # Company branding
            'company_name': self.template.company_name or "Webby Wonder",
            'company_address': self.template.company_address or "Mumbai, India",
            'company_phone': self.template.company_phone,
            'company_email': self.template.company_email,
            'company_logo_url': self.template.company_logo_url,
            
            # Typography
            'font_family': self.template.font_family or "helvetica",
            'font_size_base': self.template.font_size_base or 10,
            'font_size_header': self.template.font_size_header or 16,
            'font_size_title': self.template.font_size_title or 24,
            
            # Layout
            'header_style': self.template.header_style or "modern",
            'item_table_style': self.template.item_table_style or "modern",
            'totals_layout': self.template.totals_layout or "right",
            'layout_columns': self.template.layout_columns or "single",
            
            # Field visibility
            'show_invoice_number': self.template.show_invoice_number if self.template.show_invoice_number is not None else True,
            'show_issue_date': self.template.show_issue_date if self.template.show_issue_date is not None else True,
            'show_due_date': self.template.show_due_date if self.template.show_due_date is not None else True,
            'show_notes': self.template.show_notes if self.template.show_notes is not None else True,
            'show_terms': self.template.show_terms if self.template.show_terms is not None else True,
            'show_company_logo': self.template.show_company_logo if self.template.show_company_logo is not None else True,
            'show_company_details': self.template.show_company_details if self.template.show_company_details is not None else True,
            'show_client_details': self.template.show_client_details if self.template.show_client_details is not None else True,
            'show_line_items': self.template.show_line_items if self.template.show_line_items is not None else True,
            'show_subtotal': self.template.show_subtotal if self.template.show_subtotal is not None else True,
            'show_tax': self.template.show_tax if self.template.show_tax is not None else True,
            'show_discount': self.template.show_discount if self.template.show_discount is not None else True,
            'show_total': self.template.show_total if self.template.show_total is not None else True,
            'show_paid_amount': self.template.show_paid_amount if self.template.show_paid_amount is not None else True,
            'show_balance_due': self.template.show_balance_due if self.template.show_balance_due is not None else True,
            
            # Custom CSS (for advanced styling)
            'custom_css': self.template.custom_css
        }
    
    def get_default_config(self) -> dict:
        """Return default template configuration"""
        return {
            # Colors - Modern blue theme
            'primary_color': "#2563eb",
            'secondary_color': "#6b7280", 
            'accent_color': "#10b981",
            'text_color': "#111827",
            'background_color': "#ffffff",
            
            # Company branding
            'company_name': "Webby Wonder",
            'company_address': "Mumbai, India",
            'company_phone': None,
            'company_email': None,
            'company_logo_url': None,
            
            # Typography
            'font_family': "helvetica",
            'font_size_base': 10,
            'font_size_header': 16,
            'font_size_title': 24,
            
            # Layout
            'header_style': "modern",
            'item_table_style': "modern",
            'totals_layout': "right",
            'layout_columns': "single",
            
            # Field visibility - show all by default
            'show_invoice_number': True,
            'show_issue_date': True,
            'show_due_date': True,
            'show_notes': True,
            'show_terms': True,
            'show_company_logo': True,
            'show_company_details': True,
            'show_client_details': True,
            'show_line_items': True,
            'show_subtotal': True,
            'show_tax': True,
            'show_discount': True,
            'show_total': True,
            'show_paid_amount': True,
            'show_balance_due': True,
            
            # No custom CSS by default
            'custom_css': None
        }
    
    def get_template_type_styles(self) -> dict:
        """Get specific styling based on template type"""
        template_type = self.template.template_type if self.template else "modern"
        
        styles = {
            'modern': {
                'title_font_size': 28,
                'header_color': '#2563eb',
                'table_header_bg': '#f8fafc',
                'table_border_color': '#e2e8f0',
                'accent_bg': '#eff6ff',
                'border_radius': 0,
                'shadow': False
            },
            'classic': {
                'title_font_size': 24,
                'header_color': '#1f2937',
                'table_header_bg': '#f3f4f6',
                'table_border_color': '#d1d5db',
                'accent_bg': '#f9fafb',
                'border_radius': 0,
                'shadow': False
            },
            'minimal': {
                'title_font_size': 32,
                'header_color': '#000000',
                'table_header_bg': '#ffffff',
                'table_border_color': '#e5e7eb',
                'accent_bg': '#ffffff',
                'border_radius': 0,
                'shadow': False
            },
            'corporate': {
                'title_font_size': 26,
                'header_color': '#1e40af',
                'table_header_bg': '#f1f5f9',
                'table_border_color': '#cbd5e1',
                'accent_bg': '#f8fafc',
                'border_radius': 4,
                'shadow': True
            }
        }
        
        return styles.get(template_type, styles['modern'])
    
    def apply_template_styles(self, doc, config: dict, template_styles: dict) -> dict:
        """Apply template styles to PDF document"""
        # Apply base styling based on template configuration
        colors = self._hex_to_rgb(config['primary_color'])
        if colors:
            doc.setTextColor(colors[0], colors[1], colors[2])
        
        return config
    
    def _hex_to_rgb(self, hex_color: str) -> Optional[tuple]:
        """Convert hex color to RGB tuple"""
        if not hex_color or not hex_color.startswith('#'):
            return None
        
        hex_color = hex_color[1:]  # Remove #
        if len(hex_color) != 6:
            return None
        
        try:
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            return (r, g, b)
        except ValueError:
            return None
    
    def should_show_field(self, field_name: str) -> bool:
        """Check if a field should be displayed based on template settings"""
        config = self.get_template_config()
        return config.get(field_name, True)
    
    def get_layout_position(self, layout_type: str) -> dict:
        """Get position coordinates based on layout settings"""
        positions = {
            'header_right': {'x': 150, 'y': 20},
            'header_left': {'x': 20, 'y': 20},
            'invoice_details_left': {'x': 20, 'y': 40},
            'invoice_details_right': {'x': 150, 'y': 40},
            'client_info': {'x': 20, 'y': 70},
            'items_table_start': {'x': 20, 'y': 110},
            'totals_right': {'x': 140, 'y': 200},
            'totals_left': {'x': 20, 'y': 200}
        }
        
        return positions.get(layout_type, positions['header_right'])

def get_template_renderer(db: Session, invoice_id: int) -> TemplateRenderer:
    """Helper function to get template renderer for an invoice"""
    from app.models.invoice import Invoice
    
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice or not invoice.design_template_id:
        return TemplateRenderer(None)
    
    template = db.query(InvoiceTemplate).filter(InvoiceTemplate.id == invoice.design_template_id).first()
    return TemplateRenderer(template)

def get_default_template_renderer(db: Session, user_id: int) -> TemplateRenderer:
    """Helper function to get default template renderer for a user"""
    template = db.query(InvoiceTemplate).filter(
        InvoiceTemplate.user_id == user_id,
        InvoiceTemplate.is_default == True,
        InvoiceTemplate.is_active == True
    ).first()
    
    return TemplateRenderer(template)

