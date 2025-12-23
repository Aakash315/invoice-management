import api from './api';

export const recurringInvoiceService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.is_active !== undefined && filters.is_active !== '') params.append('is_active', filters.is_active);
    if (filters.client_id && filters.client_id !== '') params.append('client_id', filters.client_id);
    if (filters.frequency && filters.frequency !== '') params.append('frequency', filters.frequency);

    const response = await api.get(`/recurring-invoices?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/recurring-invoices/${id}`);
    return response.data;
  },

  create: async (templateData) => {
    const response = await api.post('/recurring-invoices', templateData);
    return response.data;
  },

  update: async (id, templateData) => {
    const response = await api.put(`/recurring-invoices/${id}`, templateData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/recurring-invoices/${id}`);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await api.post(`/recurring-invoices/${id}/toggle`);
    return response.data;
  },

  generateInvoice: async (id) => {
    const response = await api.post(`/recurring-invoices/${id}/generate`);
    return response.data;
  },

  generateDueInvoices: async () => {
    const response = await api.post('/recurring-invoices/generate');
    return response.data;
  },

  getPreview: async (id, count = 5) => {
    const response = await api.get(`/recurring-invoices/${id}/preview?count=${count}`);
    return response.data;
  },

  getHistory: async (id, limit = 50, offset = 0) => {
    const response = await api.get(`/recurring-invoices/${id}/history?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/recurring-invoices/stats');
    return response.data;
  },
};
