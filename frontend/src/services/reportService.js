import api from './api';

export const reportService = {
  getRevenueReport: async (params) => {
    const response = await api.get('/reports/revenue', { params });
    return response.data;
  },
  getTopClientsReport: async (params) => {
    const response = await api.get('/reports/top-clients', { params });
    return response.data;
  },
  getLatePayingClientsReport: async () => {
    const response = await api.get('/reports/late-paying-clients');
    return response.data;
  },
};
