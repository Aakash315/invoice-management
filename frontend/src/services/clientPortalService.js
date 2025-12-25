import clientApi from './clientApi';

export const clientPortalService = {
  getClientDashboardData: async () => {
    const response = await clientApi.get('/client-portal/dashboard');
    return response.data;
  },

  getClientInvoices: async () => {
    const response = await clientApi.get('/client-portal/invoices');
    return response.data;
  },

  getClientInvoiceById: async (id) => {
    const response = await clientApi.get(`/client-portal/invoices/${id}`);
    return response.data;
  },

  getClientPayments: async () => {
    const response = await clientApi.get('/client-portal/payments');
    return response.data;
  },

  updateClientProfile: async (profileData) => {
    const response = await clientApi.put('/client-portal/profile', profileData);
    return response.data;
  },

  createCashfreeOrder: async (invoiceId, amount) => {
    const response = await clientApi.post('/client-portal/payments/cashfree/orders', { invoice_id: invoiceId, amount: amount });
    return response.data;
  },

  createPayPalOrder: async (invoiceId, amount) => {
    const response = await clientApi.post('/client-portal/payments/paypal/orders', { invoice_id: invoiceId, amount: amount });
    return response.data;
  },

  capturePayPalPayment: async (orderId, invoiceId) => {
    const response = await clientApi.post('/client-portal/payments/paypal/capture', { order_id: orderId, invoice_id: invoiceId });
    return response.data;
  },

  verifyCashfreeOrder: async (orderId) => {
    const response = await clientApi.get(`/client-portal/verify/cashfree-order/${orderId}`);
    return response.data;
  },
};
