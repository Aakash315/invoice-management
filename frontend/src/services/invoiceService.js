import api from './api';

export const invoiceService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.payment_status) params.append('payment_status', filters.payment_status);
    if (filters.client_id) params.append('client_id', filters.client_id);
    if (filters.currency) params.append('currency', filters.currency);
    if (filters.search) params.append('search', filters.search);
    if (filters.recurring) params.append('recurring', filters.recurring);
    
    // Date filters
    if (filters.date_range) params.append('date_range', filters.date_range);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    
    // Amount filters
    if (filters.amount_range) params.append('amount_range', filters.amount_range);
    if (filters.amount_min) params.append('amount_min', filters.amount_min);
    if (filters.amount_max) params.append('amount_max', filters.amount_max);

    const response = await api.get(`/invoices?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (invoiceData) => {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  },

  update: async (id, invoiceData) => {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  addPayment: async (invoiceId, paymentData) => {
    const response = await api.post(`/payments/invoice/${invoiceId}`, paymentData);
    return response.data;
  },

  sendInvoiceEmail: async (id, emailData) => {
    const response = await api.post(`/invoices/${id}/send-email`, emailData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getEmailHistory: async (id) => {
    const response = await api.get(`/invoices/${id}/email-history`);
    return response.data;
  },
};