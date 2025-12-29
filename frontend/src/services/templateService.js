import api from './api';

export const templateService = {
  // Get all templates for the current user
  getTemplates: async () => {
    const response = await api.get('/templates');
    return response.data;
  },

  // Get a specific template
  getTemplate: async (templateId) => {
    const response = await api.get(`/templates/${templateId}`);
    return response.data;
  },

  // Create a new template
  createTemplate: async (templateData) => {
    const response = await api.post('/templates', templateData);
    return response.data;
  },

  // Update an existing template
  updateTemplate: async (templateId, templateData) => {
    const response = await api.put(`/templates/${templateId}`, templateData);
    return response.data;
  },

  // Delete a template
  deleteTemplate: async (templateId) => {
    await api.delete(`/templates/${templateId}`);
  },

  // Duplicate a template
  duplicateTemplate: async (templateId) => {
    const response = await api.post(`/templates/${templateId}/duplicate`);
    return response.data;
  },

  // Set a template as default
  setDefaultTemplate: async (templateId) => {
    const response = await api.put(`/templates/${templateId}/default`);
    return response.data;
  },

  // Get template preview data
  getTemplatePreview: async (templateId) => {
    const response = await api.get(`/templates/${templateId}/preview`);
    return response.data;
  },

  // Get default template for user
  getDefaultTemplate: async () => {
    const response = await api.get('/templates/default');
    return response.data;
  },

  // Create default templates
  createDefaultTemplates: async () => {
    const response = await api.post('/templates/create-defaults');
    return response.data;
  }
};

export default templateService;
