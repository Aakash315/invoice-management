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
};

