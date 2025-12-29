import api from './api';

export const expenseCategoryService = {
  // Get all expense categories
  getExpenseCategories: async (includeInactive = false) => {
    const response = await api.get(`/expense-categories?include_inactive=${includeInactive}`);
    return response.data;
  },

  // Get a specific expense category
  getExpenseCategory: async (categoryId) => {
    const response = await api.get(`/expense-categories/${categoryId}`);
    return response.data;
  },

  // Create a new expense category
  createExpenseCategory: async (categoryData) => {
    const response = await api.post('/expense-categories', categoryData);
    return response.data;
  },

  // Update an existing expense category
  updateExpenseCategory: async (categoryId, categoryData) => {
    const response = await api.put(`/expense-categories/${categoryId}`, categoryData);
    return response.data;
  },

  // Delete an expense category
  deleteExpenseCategory: async (categoryId) => {
    const response = await api.delete(`/expense-categories/${categoryId}`);
    return response.data;
  },

  // Toggle category active status
  toggleCategoryActive: async (categoryId) => {
    const response = await api.post(`/expense-categories/${categoryId}/toggle-active`);
    return response.data;
  },

  // Get category usage statistics
  getCategoryUsageStats: async (categoryId) => {
    const response = await api.get(`/expense-categories/${categoryId}/usage-stats`);
    return response.data;
  },

  // Get popular categories (most used)
  getPopularCategories: async (limit = 10) => {
    const response = await api.get(`/expense-categories/popular?limit=${limit}`);
    return response.data;
  },

  // Get categories with expense counts
  getCategoriesWithCounts: async () => {
    const response = await api.get('/expense-categories/with-counts');
    return response.data;
  },

  // Reorder categories
  reorderCategories: async (categoryOrder) => {
    const response = await api.put('/expense-categories/reorder', {
      category_order: categoryOrder
    });
    return response.data;
  },

  // Bulk operations
  bulkUpdateCategories: async (categoryUpdates) => {
    const response = await api.put('/expense-categories/bulk-update', {
      category_updates: categoryUpdates
    });
    return response.data;
  },

  bulkDeleteCategories: async (categoryIds) => {
    const response = await api.post('/expense-categories/bulk-delete', {
      category_ids: categoryIds
    });
    return response.data;
  },

  // Get categories by color
  getCategoriesByColor: async () => {
    const response = await api.get('/expense-categories/by-color');
    return response.data;
  },

  // Get predefined categories
  getPredefinedCategories: async () => {
    const response = await api.get('/expense-categories/predefined');
    return response.data;
  },

  // Create categories from predefined list
  createFromPredefined: async (selectedCategories) => {
    const response = await api.post('/expense-categories/from-predefined', {
      categories: selectedCategories
    });
    return response.data;
  },

  // Get category suggestions based on expense description
  getCategorySuggestions: async (description) => {
    const response = await api.get(`/expense-categories/suggestions?q=${encodeURIComponent(description)}`);
    return response.data;
  },

  // Merge two categories
  mergeCategories: async (sourceCategoryId, targetCategoryId) => {
    const response = await api.post('/expense-categories/merge', {
      source_category_id: sourceCategoryId,
      target_category_id: targetCategoryId
    });
    return response.data;
  },

  // Get category hierarchy (if nested categories are implemented)
  getCategoryHierarchy: async () => {
    const response = await api.get('/expense-categories/hierarchy');
    return response.data;
  },

  // Create subcategory
  createSubcategory: async (parentCategoryId, subcategoryData) => {
    const response = await api.post(`/expense-categories/${parentCategoryId}/subcategory`, subcategoryData);
    return response.data;
  },

  // Export categories
  exportCategories: async () => {
    const response = await api.get('/expense-categories/export', {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expense_categories_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Import categories
  importCategories: async (categoryFile) => {
    const formData = new FormData();
    formData.append('categories_file', categoryFile);
    
    const response = await api.post('/expense-categories/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get category analytics
  getCategoryAnalytics: async (period = 'month', months = 12) => {
    const response = await api.get(`/expense-categories/analytics?period=${period}&months=${months}`);
    return response.data;
  },

  // Validate category name
  validateCategoryName: async (name, excludeId = null) => {
    const params = new URLSearchParams();
    params.append('name', name);
    if (excludeId) params.append('exclude_id', excludeId);

    const response = await api.get(`/expense-categories/validate?${params.toString()}`);
    return response.data;
  },

  // Get default categories for business type
  getDefaultCategoriesForBusiness: async (businessType) => {
    const response = await api.get(`/expense-categories/defaults/${businessType}`);
    return response.data;
  },

  // Reset to default categories
  resetToDefaults: async () => {
    const response = await api.post('/expense-categories/reset-defaults');
    return response.data;
  },

  // Archive categories (soft delete)
  archiveCategories: async (categoryIds) => {
    const response = await api.post('/expense-categories/archive', {
      category_ids: categoryIds
    });
    return response.data;
  },

  // Restore archived categories
  restoreCategories: async (categoryIds) => {
    const response = await api.post('/expense-categories/restore', {
      category_ids: categoryIds
    });
    return response.data;
  },

  // Get archived categories
  getArchivedCategories: async () => {
    const response = await api.get('/expense-categories/archived');
    return response.data;
  },

  // Search categories
  searchCategories: async (query) => {
    const response = await api.get(`/expense-categories/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get category trends
  getCategoryTrends: async (categoryId, period = 'month') => {
    const response = await api.get(`/expense-categories/${categoryId}/trends?period=${period}`);
    return response.data;
  }
};

export default expenseCategoryService;
