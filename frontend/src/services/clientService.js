import api from './api';

export const clientService = {
  getAll: async () => {
    const response = await api.get('/clients');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  create: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  update: async (id, clientData) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  // Document upload methods
  uploadDocument: async (clientId, documentType, file) => {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    
    const response = await api.put(`/clients/${clientId}/document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteDocument: async (clientId) => {
    const response = await api.delete(`/clients/${clientId}/document`);
    return response.data;
  },

  getDocument: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/document`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Return deposit method
  returnDeposit: async (clientId, returnType = 'cash') => {
    const response = await api.put(`/clients/${clientId}/return-deposit`, {}, {
      params: { return_type: returnType }
    });
    return response.data;
  },

  // Deposit history methods
  getClientDepositHistory: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/deposit-history`);
    return response.data;
  },

  getAllDepositHistory: async () => {
    const response = await api.get(`/clients/deposit-history/all`);
    return response.data;
  },

  updateDepositHistory: async (historyId, data) => {
    const response = await api.put(`/clients/deposit-history/${historyId}`, null, {
      params: {
        amount: data.amount,
        return_type: data.return_type,
        notes: data.notes || ''
      }
    });
    return response.data;
  },

  deleteDepositHistory: async (historyId) => {
    const response = await api.delete(`/clients/deposit-history/${historyId}`);
    return response.data;
  },
};

