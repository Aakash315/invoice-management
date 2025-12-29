// Predefined Expense Categories with Colors and Descriptions
export const predefinedExpenseCategories = [
  {
    name: 'Office Supplies',
    description: 'Pens, paper, notebooks, staplers, office equipment',
    color: '#3B82F6', // Blue
    is_active: true
  },
  {
    name: 'Software & Subscriptions',
    description: 'SaaS tools, software licenses, cloud services',
    color: '#10B981', // Green
    is_active: true
  },
  {
    name: 'Hardware & Equipment',
    description: 'Computers, phones, office equipment, furniture',
    color: '#F59E0B', // Yellow
    is_active: true
  },
  {
    name: 'Travel & Transportation',
    description: 'Flights, hotels, car rentals, fuel, public transport',
    color: '#EF4444', // Red
    is_active: true
  },
  {
    name: 'Professional Services',
    description: 'Legal, accounting, consulting, design services',
    color: '#8B5CF6', // Purple
    is_active: true
  },
  {
    name: 'Marketing & Advertising',
    description: 'Digital ads, print ads, promotional materials',
    color: '#06B6D4', // Cyan
    is_active: true
  },
  {
    name: 'Rent & Utilities',
    description: 'Office rent, electricity, water, internet, phone',
    color: '#84CC16', // Lime
    is_active: true
  },
  {
    name: 'Taxes & Fees',
    description: 'Business taxes, regulatory fees, government charges',
    color: '#F97316', // Orange
    is_active: true
  },
  {
    name: 'Bank Charges',
    description: 'Banking fees, transaction charges, loan interest',
    color: '#EC4899', // Pink
    is_active: true
  },
  {
    name: 'Insurance',
    description: 'Business insurance, professional liability, health insurance',
    color: '#6B7280', // Gray
    is_active: true
  },
  {
    name: 'Training & Education',
    description: 'Courses, workshops, conferences, certifications',
    color: '#1F2937', // Dark Gray
    is_active: true
  },
  {
    name: 'Business Meals',
    description: 'Client dinners, team lunches, business entertainment',
    color: '#059669', // Emerald
    is_active: true
  },
  {
    name: 'Communication',
    description: 'Phone bills, internet, postage, courier services',
    color: '#DC2626', // Red
    is_active: true
  },
  {
    name: 'Maintenance & Repairs',
    description: 'Equipment repair, software maintenance, facility upkeep',
    color: '#7C2D12', // Brown
    is_active: true
  },
  {
    name: 'Research & Development',
    description: 'Product development, testing, prototyping materials',
    color: '#7C3AED', // Purple
    is_active: true
  },
  {
    name: 'Legal & Compliance',
    description: 'Legal fees, compliance costs, regulatory expenses',
    color: '#BE185D', // Rose
    is_active: true
  },
  {
    name: 'Accounting',
    description: 'Bookkeeping, tax preparation, financial consulting',
    color: '#0F766E', // Teal
    is_active: true
  },
  {
    name: 'Website & Domain',
    description: 'Domain registration, web hosting, website maintenance',
    color: '#1D4ED8', // Blue
    is_active: true
  },
  {
    name: 'Cloud Services',
    description: 'AWS, Google Cloud, Microsoft Azure, hosting services',
    color: '#059669', // Green
    is_active: true
  }
];

// Expense Category Colors (for color picker)
export const expenseCategoryColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#1F2937', // Dark Gray
  '#059669', // Emerald
  '#DC2626', // Red
  '#7C2D12', // Brown
  '#BE185D', // Rose
  '#0F766E', // Teal
  '#1D4ED8', // Blue
  '#7C3AED', // Purple
  '#059669', // Green
  '#E11D48'  // Rose
];

// Common Payment Methods
export const paymentMethods = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Check',
  'Digital Wallet',
  'Other'
];

// Supported Currencies
export const supportedCurrencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }
];

// Expense Status Options
export const expenseStatuses = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'reimbursed', label: 'Reimbursed', color: 'blue' },
  { value: 'rejected', label: 'Rejected', color: 'red' }
];

// Expense Type Categories for Quick Selection
export const quickExpenseTypes = [
  {
    name: 'Office Supplies',
    icon: '📝',
    description: 'Pens, paper, office materials',
    categories: ['Office Supplies']
  },
  {
    name: 'Software & Tools',
    icon: '💻',
    description: 'SaaS tools, software licenses',
    categories: ['Software & Subscriptions', 'Website & Domain', 'Cloud Services']
  },
  {
    name: 'Business Travel',
    icon: '✈️',
    description: 'Flights, hotels, transportation',
    categories: ['Travel & Transportation']
  },
  {
    name: 'Professional Services',
    icon: '⚖️',
    description: 'Legal, accounting, consulting',
    categories: ['Professional Services', 'Legal & Compliance', 'Accounting']
  },
  {
    name: 'Marketing',
    icon: '📢',
    description: 'Advertising, promotions',
    categories: ['Marketing & Advertising']
  },
  {
    name: 'Office Expenses',
    icon: '🏢',
    description: 'Rent, utilities, maintenance',
    categories: ['Rent & Utilities', 'Maintenance & Repairs']
  },
  {
    name: 'Training',
    icon: '🎓',
    description: 'Courses, workshops, conferences',
    categories: ['Training & Education']
  },
  {
    name: 'Business Meals',
    icon: '🍽️',
    description: 'Client dinners, team lunches',
    categories: ['Business Meals']
  }
];

// Default Receipt File Types
export const receiptFileTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf'
];

// Maximum Receipt File Size (5MB)
export const maxReceiptFileSize = 5 * 1024 * 1024;

// Expense Validation Rules
export const expenseValidationRules = {
  minAmount: 0.01,
  maxAmount: 9999999.99,
  descriptionMaxLength: 500,
  vendorMaxLength: 200,
  receiptFileSize: maxReceiptFileSize
};

// Export/Import Configuration
export const exportFormats = [
  { value: 'csv', label: 'CSV', extension: '.csv' },
  { value: 'excel', label: 'Excel', extension: '.xlsx' },
  { value: 'pdf', label: 'PDF', extension: '.pdf' }
];

// Helper Functions

/**
 * Get predefined category by name
 */
export const getPredefinedCategory = (name) => {
  return predefinedExpenseCategories.find(
    category => category.name.toLowerCase() === name.toLowerCase()
  );
};

/**
 * Get currency symbol by code
 */
export const getCurrencySymbol = (currencyCode) => {
  const currency = supportedCurrencies.find(curr => curr.code === currencyCode);
  return currency ? currency.symbol : currencyCode;
};

/**
 * Get expense status color
 */
export const getExpenseStatusColor = (status) => {
  const statusConfig = expenseStatuses.find(s => s.value === status);
  return statusConfig ? statusConfig.color : 'gray';
};

/**
 * Validate receipt file
 */
export const validateReceiptFile = (file) => {
  if (!file) return { isValid: true };

  // Check file type
  if (!receiptFileTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, GIF, or PDF files only.'
    };
  }

  // Check file size
  if (file.size > maxReceiptFileSize) {
    return {
      isValid: false,
      error: `File size must be less than ${maxReceiptFileSize / (1024 * 1024)}MB.`
    };
  }

  return { isValid: true };
};

/**
 * Format currency amount
 */
export const formatCurrencyAmount = (amount, currencyCode = 'INR') => {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = typeof amount === 'number' 
    ? amount.toFixed(2) 
    : parseFloat(amount || 0).toFixed(2);
  
  return `${symbol}${formattedAmount}`;
};

/**
 * Get quick expense categories for a given type
 */
export const getQuickExpenseCategories = (typeName) => {
  const type = quickExpenseTypes.find(t => t.name === typeName);
  return type ? type.categories : [];
};

/**
 * Get all unique colors from predefined categories
 */
export const getAllCategoryColors = () => {
  const colors = new Set(predefinedExpenseCategories.map(cat => cat.color));
  return Array.from(colors);
};
