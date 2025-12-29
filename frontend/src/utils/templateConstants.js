// Template Types
export const templateTypes = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'corporate', label: 'Corporate' },
];

// Color Presets
export const colorPresets = [
  {
    name: 'Ocean Blue',
    colors: {
      color_primary: '#2563eb',
      color_secondary: '#64748b',
      color_accent: '#0ea5e9',
      color_text: '#0f172a',
      color_background: '#ffffff'
    }
  },
  {
    name: 'Forest Green',
    colors: {
      color_primary: '#059669',
      color_secondary: '#6b7280',
      color_accent: '#10b981',
      color_text: '#111827',
      color_background: '#ffffff'
    }
  },
  {
    name: 'Sunset Orange',
    colors: {
      color_primary: '#ea580c',
      color_secondary: '#9ca3af',
      color_accent: '#f59e0b',
      color_text: '#111827',
      color_background: '#ffffff'
    }
  },
  {
    name: 'Royal Purple',
    colors: {
      color_primary: '#7c3aed',
      color_secondary: '#8b5cf6',
      color_accent: '#a855f7',
      color_text: '#111827',
      color_background: '#ffffff'
    }
  },
  {
    name: 'Crimson Red',
    colors: {
      color_primary: '#dc2626',
      color_secondary: '#6b7280',
      color_accent: '#ef4444',
      color_text: '#111827',
      color_background: '#ffffff'
    }
  },
  {
    name: 'Midnight Dark',
    colors: {
      color_primary: '#1e293b',
      color_secondary: '#475569',
      color_accent: '#3b82f6',
      color_text: '#f8fafc',
      color_background: '#ffffff'
    }
  },
  {
    name: 'Rose Gold',
    colors: {
      color_primary: '#be185d',
      color_secondary: '#9ca3af',
      color_accent: '#ec4899',
      color_text: '#111827',
      color_background: '#ffffff'
    }
  },
  {
    name: 'Monochrome',
    colors: {
      color_primary: '#000000',
      color_secondary: '#6b7280',
      color_accent: '#374151',
      color_text: '#111827',
      color_background: '#ffffff'
    }
  }
];

// Font Families
export const fontFamilies = [
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'times', label: 'Times New Roman' },
  { value: 'courier', label: 'Courier New' },
  { value: 'arial', label: 'Arial' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'verdana', label: 'Verdana' },
  { value: 'trebuchet', label: 'Trebuchet MS' },
  { value: 'impact', label: 'Impact' },
];

// Layout Options
export const layoutOptions = {
  headerStyles: [
    { value: 'modern', label: 'Modern', preview: 'Clean lines with accent colors' },
    { value: 'classic', label: 'Classic', preview: 'Traditional bordered header' },
    { value: 'minimal', label: 'Minimal', preview: 'Simple, no borders' },
    { value: 'corporate', label: 'Corporate', preview: 'Professional with shadows' },
  ],
  tableStyles: [
    { value: 'modern', label: 'Modern', preview: 'Striped rows, hover effects' },
    { value: 'classic', label: 'Classic', preview: 'Bordered table cells' },
    { value: 'minimal', label: 'Minimal', preview: 'Clean lines only' },
  ],
  totalsLayouts: [
    { value: 'right', label: 'Right Aligned', preview: 'Totals on the right' },
    { value: 'left', label: 'Left Aligned', preview: 'Totals on the left' },
    { value: 'center', label: 'Center Aligned', preview: 'Totals in center' },
  ],
  layoutColumns: [
    { value: 'single', label: 'Single Column', preview: 'Standard single column layout' },
    { value: 'two', label: 'Two Columns', preview: 'Two column layout' },
  ]
};

// Predefined Template Configurations
export const predefinedTemplates = [
  {
    name: 'Professional Blue',
    template_type: 'modern',
    description: 'A clean, professional template perfect for business invoices',
    color_primary: '#2563eb',
    color_secondary: '#6b7280',
    color_accent: '#3b82f6',
    color_text: '#111827',
    color_background: '#ffffff',
    font_family: 'helvetica',
    font_size_base: 10,
    font_size_header: 16,
    font_size_title: 24,
    header_style: 'modern',
    item_table_style: 'modern',
    totals_layout: 'right',
    layout_columns: 'single',
    is_default: true,
  },
  {
    name: 'Classic Corporate',
    template_type: 'corporate',
    description: 'Traditional corporate design with elegant borders',
    color_primary: '#1e40af',
    color_secondary: '#64748b',
    color_accent: '#0ea5e9',
    color_text: '#0f172a',
    color_background: '#ffffff',
    font_family: 'times',
    font_size_base: 11,
    font_size_header: 15,
    font_size_title: 22,
    header_style: 'corporate',
    item_table_style: 'classic',
    totals_layout: 'left',
    layout_columns: 'single',
    is_default: false,
  },
  {
    name: 'Minimalist Clean',
    template_type: 'minimal',
    description: 'Ultra-clean design focusing on essential information',
    color_primary: '#000000',
    color_secondary: '#6b7280',
    color_accent: '#374151',
    color_text: '#111827',
    color_background: '#ffffff',
    font_family: 'arial',
    font_size_base: 10,
    font_size_header: 14,
    font_size_title: 28,
    header_style: 'minimal',
    item_table_style: 'minimal',
    totals_layout: 'right',
    layout_columns: 'single',
    is_default: false,
  },
  {
    name: 'Modern Gradient',
    template_type: 'modern',
    description: 'Contemporary design with gradient accents',
    color_primary: '#7c3aed',
    color_secondary: '#8b5cf6',
    color_accent: '#a855f7',
    color_text: '#111827',
    color_background: '#ffffff',
    font_family: 'georgia',
    font_size_base: 10,
    font_size_header: 16,
    font_size_title: 26,
    header_style: 'modern',
    item_table_style: 'modern',
    totals_layout: 'center',
    layout_columns: 'single',
    is_default: false,
  },
];

// Default field visibility settings
export const defaultFieldVisibility = {
  show_invoice_number: true,
  show_issue_date: true,
  show_due_date: true,
  show_notes: true,
  show_terms: true,
  show_company_logo: true,
  show_company_details: true,
  show_client_details: true,
  show_line_items: true,
  show_subtotal: true,
  show_tax: true,
  show_discount: true,
  show_total: true,
  show_paid_amount: true,
  show_balance_due: true,
};

// Helper functions
export const getTemplatePreview = (template) => {
  return {
    id: template.id,
    name: template.name,
    type: template.template_type,
    colors: {
      primary: template.color_primary,
      secondary: template.color_secondary,
      accent: template.color_accent,
      text: template.color_text,
      background: template.color_background,
    },
    fontFamily: template.font_family,
    isDefault: template.is_default,
    isActive: template.is_active,
  };
};

export const validateTemplateColors = (colors) => {
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const requiredColors = ['color_primary', 'color_secondary', 'color_accent', 'color_text', 'color_background'];
  
  for (const colorKey of requiredColors) {
    if (!colors[colorKey] || !colorRegex.test(colors[colorKey])) {
      return { isValid: false, error: `Invalid ${colorKey} color format` };
    }
  }
  
  return { isValid: true };
};

export const generateTemplateCSS = (template) => {
  let css = `
/* Template: ${template.name} */
.invoice-template-${template.id || 'new'} {
  --primary-color: ${template.color_primary};
  --secondary-color: ${template.color_secondary};
  --accent-color: ${template.color_accent};
  --text-color: ${template.color_text};
  --background-color: ${template.color_background};
  --font-family: ${template.font_family};
  --font-size-base: ${template.font_size_base}px;
  --font-size-header: ${template.font_size_header}px;
  --font-size-title: ${template.font_size_title}px;
}

.invoice-template-${template.id || 'new'} .invoice-header {
  color: var(--primary-color);
  font-family: var(--font-family);
  font-size: var(--font-size-header);
}

.invoice-template-${template.id || 'new'} .invoice-title {
  font-size: var(--font-size-title);
  color: var(--primary-color);
}

.invoice-template-${template.id || 'new'} .invoice-table {
  border-collapse: collapse;
  width: 100%;
}

.invoice-template-${template.id || 'new'} .invoice-table th {
  background-color: var(--accent-color);
  color: var(--text-color);
  font-size: var(--font-size-base);
  padding: 8px;
  text-align: left;
}

.invoice-template-${template.id || 'new'} .invoice-table td {
  border: 1px solid var(--secondary-color);
  padding: 8px;
  font-size: var(--font-size-base);
}
`;

  // Add custom CSS if provided
  if (template.custom_css) {
    css += `
/* Custom CSS */
${template.custom_css}
`;
  }

  return css;
};
