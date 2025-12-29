import api from './api';

export const expenseService = {
  // Get all expenses with optional filtering
  getExpenses: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add filters to params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  // Get a specific expense
  getExpense: async (expenseId) => {
    const response = await api.get(`/expenses/${expenseId}`);
    return response.data;
  },

  // Create a new expense
  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Update an existing expense
  updateExpense: async (expenseId, expenseData) => {
    const response = await api.put(`/expenses/${expenseId}`, expenseData);
    return response.data;
  },

  // Delete an expense
  deleteExpense: async (expenseId) => {
    await api.delete(`/expenses/${expenseId}`);
  },

  // Get expense summary/overview
  getExpenseSummary: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/expenses/summary/overview?${params.toString()}`);
    return response.data;
  },

  // Export expenses to CSV
  exportExpensesCSV: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/expenses/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;

    const contentDisposition = response.headers['content-disposition'];
    let filename = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch.length > 1) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Upload receipt for expense
  uploadReceipt: async (expenseId, receiptFile) => {
    const formData = new FormData();
    formData.append('receipt', receiptFile);
    
    const response = await api.post(`/expenses/${expenseId}/upload-receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get expenses by category
  getExpensesByCategory: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/reports/expenses/by-category?${params.toString()}`);
    return response.data;
  },

  // Get top expense vendors
  getTopVendors: async (limit = 10, startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    params.append('limit', limit);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/reports/expenses/by-vendor?${params.toString()}`);
    return response.data;
  },

  // Get tax deductible expenses
  getTaxDeductibleExpenses: async (taxYear = null) => {
    const params = new URLSearchParams();
    if (taxYear) params.append('tax_year', taxYear);

    const response = await api.get(`/reports/tax-deductible-expenses?${params.toString()}`);
    return response.data;
  },

  // Get profit analysis
  getProfitAnalysis: async (startDate = null, endDate = null, groupBy = 'month') => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (groupBy) params.append('group_by', groupBy);

    const response = await api.get(`/reports/profit-analysis?${params.toString()}`);
    return response.data;
  },

  // Quick expense entry (simplified form)
  createQuickExpense: async (quickExpenseData) => {
    const response = await api.post('/expenses/quick', quickExpenseData);
    return response.data;
  },

  // Duplicate an expense
  duplicateExpense: async (expenseId) => {
    const response = await api.post(`/expenses/${expenseId}/duplicate`);
    return response.data;
  },

  // Get expense statistics for dashboard
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get detailed profit dashboard data
  getProfitDashboard: async () => {
    const response = await api.get('/dashboard/profit');
    return response.data;
  },

  // Bulk operations
  bulkDeleteExpenses: async (expenseIds) => {
    const response = await api.post('/expenses/bulk-delete', {
      expense_ids: expenseIds
    });
    return response.data;
  },

  bulkUpdateExpenses: async (expenseIds, updateData) => {
    const response = await api.put('/expenses/bulk-update', {
      expense_ids: expenseIds,
      update_data: updateData
    });
    return response.data;
  },

  // Get expenses for a specific client
  getClientExpenses: async (clientId, filters = {}) => {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  // Get expenses for a specific invoice
  getInvoiceExpenses: async (invoiceId) => {
    const response = await api.get(`/expenses?invoice_id=${invoiceId}`);
    return response.data;
  },

  // Search expenses
  searchExpenses: async (query, filters = {}) => {
    const params = new URLSearchParams();
    params.append('search', query);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  // Get expense trends
  getExpenseTrends: async (period = 'month', months = 12) => {
    const response = await api.get(`/reports/expense-trends?period=${period}&months=${months}`);
    return response.data;
  }
};

export default expenseService;
