import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { expenseCategoryService } from '../../services/expenseCategoryService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  TagIcon,
  SwatchIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const ExpenseCategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [usageStats, setUsageStats] = useState(null);

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#1F2937', // Dark Gray
    '#059669', // Emerald
  ];

  const predefinedCategories = [
    'Office Supplies',
    'Software & Subscriptions',
    'Hardware & Equipment',
    'Travel & Transportation',
    'Professional Services',
    'Marketing & Advertising',
    'Rent & Utilities',
    'Taxes & Fees',
    'Bank Charges',
    'Insurance',
    'Training & Education',
    'Business Meals',
    'Communication',
    'Maintenance & Repairs',
    'Research & Development',
    'Consulting',
    'Legal & Compliance',
    'Accounting',
    'Website & Domain',
    'Cloud Services'
  ];

  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Category name is required')
      .max(100, 'Category name must be less than 100 characters'),
    description: Yup.string()
      .max(500, 'Description must be less than 500 characters'),
    color: Yup.string()
      .required('Color is required')
      .matches(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    is_active: Yup.boolean(),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      color: '#3B82F6',
      is_active: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (id) {
          await expenseCategoryService.updateExpenseCategory(id, values);
          toast.success('Category updated successfully');
        } else {
          await expenseCategoryService.createExpenseCategory(values);
          toast.success('Category created successfully');
        }
        navigate('/expense-categories', { state: { refresh: true } });
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to save category');
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch category if editing
  useEffect(() => {
    if (id) {
      const fetchCategory = async () => {
        try {
          const category = await expenseCategoryService.getExpenseCategory(id);
          formik.setValues({
            name: category.name,
            description: category.description || '',
            color: category.color || '#3B82F6',
            is_active: category.is_active !== false,
          });

          // Fetch usage statistics
          try {
            const stats = await expenseCategoryService.getCategoryUsageStats(id);
            setUsageStats(stats);
          } catch (statsError) {
            console.warn('Failed to fetch usage stats:', statsError);
          }
        } catch (error) {
          toast.error('Failed to fetch category');
          navigate('/expense-categories');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchCategory();
    }
  }, [id]);

  // Load predefined category data if name matches
  useEffect(() => {
    if (!id && formik.values.name) {
      const predefinedCategory = predefinedCategories.find(
        cat => cat.toLowerCase() === formik.values.name.toLowerCase()
      );
      
      if (predefinedCategory) {
        // Set default color for predefined categories
        const colorIndex = predefinedCategories.indexOf(predefinedCategory);
        formik.setFieldValue('color', predefinedColors[colorIndex % predefinedColors.length]);
      }
    }
  }, [formik.values.name, id]);

  const handleColorSelect = (color) => {
    formik.setFieldValue('color', color);
  };

  const handleQuickCategorySelect = (categoryName) => {
    formik.setFieldValue('name', categoryName);
    const colorIndex = predefinedCategories.indexOf(categoryName);
    formik.setFieldValue('color', predefinedColors[colorIndex % predefinedColors.length]);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Expense Category' : 'Create New Expense Category'}
        </h1>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Quick Category Selection */}
        {!id && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Start - Choose a Category
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select from common expense categories or create a custom one below.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {predefinedCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleQuickCategorySelect(category)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: predefinedColors[
                          predefinedCategories.indexOf(category) % predefinedColors.length
                        ]
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">
                      {category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Details */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TagIcon className="h-5 w-5 mr-2" />
            Category Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g., Office Supplies, Software Subscriptions"
                className={`input-field ${
                  formik.touched.name && formik.errors.name
                    ? 'border-red-500'
                    : ''
                }`}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.name}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rows={3}
                placeholder="Describe what expenses belong in this category..."
                className="input-field"
              />
              {formik.touched.description && formik.errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="is_active"
                value={formik.values.is_active.toString()}
                onChange={(e) => formik.setFieldValue('is_active', e.target.value === 'true')}
                className="input-field"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Inactive categories won't appear in expense forms
              </p>
            </div>
          </div>
        </div>

        {/* Color Selection */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SwatchIcon className="h-5 w-5 mr-2" />
            Category Color
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a color <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    formik.values.color === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formik.values.color}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formik.values.color}
                  onChange={(e) => formik.setFieldValue('color', e.target.value)}
                  placeholder="#3B82F6"
                  className="input-field flex-1 max-w-xs"
                />
              </div>
              {formik.touched.color && formik.errors.color && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.color}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Usage Statistics (for edit mode) */}
        {usageStats && (
          <div className="card p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Usage Statistics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {usageStats.expense_count}
                </div>
                <div className="text-sm text-gray-600">
                  Total Expenses
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  ₹{usageStats.total_amount?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-600">
                  Total Amount
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  usageStats.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {usageStats.is_active ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Status
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={loading || !formik.isValid}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Category' : 'Create Category'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/expense-categories')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseCategoryForm;
