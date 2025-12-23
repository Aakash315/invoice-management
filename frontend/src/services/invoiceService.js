import api from './api';

export const invoiceService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.payment_status) params.append('payment_status', filters.payment_status);
    if (filters.client_id) params.append('client_id', filters.client_id);
    if (filters.currency) params.append('currency', filters.currency);

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