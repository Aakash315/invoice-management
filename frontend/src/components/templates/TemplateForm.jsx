import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { templateService } from '../../services/templateService';
import { templateTypes, colorPresets, fontFamilies, layoutOptions } from '../../utils/templateConstants';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  const validationSchema = Yup.object({
    name: Yup.string().required('Template name is required'),
    template_type: Yup.string().required('Template type is required'),
    description: Yup.string(),
    is_active: Yup.boolean(),
    is_default: Yup.boolean(),
    
    // Company branding
    company_name: Yup.string().required('Company name is required'),
    company_address: Yup.string(),
    company_phone: Yup.string(),
    company_email: Yup.string().email('Invalid email format'),
    company_logo_url: Yup.string().url('Invalid URL format'),
    
    // Colors
    color_primary: Yup.string().required('Primary color is required'),
    color_secondary: Yup.string().required('Secondary color is required'),
    color_accent: Yup.string().required('Accent color is required'),
    color_text: Yup.string().required('Text color is required'),
    color_background: Yup.string().required('Background color is required'),
    
    // Typography
    font_family: Yup.string().required('Font family is required'),
    font_size_base: Yup.number().required('Base font size is required').min(8).max(20),
    font_size_header: Yup.number().required('Header font size is required').min(10).max(24),
    font_size_title: Yup.number().required('Title font size is required').min(14).max(36),
    
    // Layout
    header_style: Yup.string().required('Header style is required'),
    item_table_style: Yup.string().required('Item table style is required'),
    totals_layout: Yup.string().required('Totals layout is required'),
    layout_columns: Yup.string().required('Layout columns is required'),
    
    // Field visibility (all booleans)
    show_invoice_number: Yup.boolean(),
    show_issue_date: Yup.boolean(),
    show_due_date: Yup.boolean(),
    show_notes: Yup.boolean(),
    show_terms: Yup.boolean(),
    show_company_logo: Yup.boolean(),
    show_company_details: Yup.boolean(),
    show_client_details: Yup.boolean(),
    show_line_items: Yup.boolean(),
    show_subtotal: Yup.boolean(),
    show_tax: Yup.boolean(),
    show_discount: Yup.boolean(),
    show_total: Yup.boolean(),
    show_paid_amount: Yup.boolean(),
    show_balance_due: Yup.boolean(),
    
    // Custom styling
    custom_css: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      template_type: 'modern',
      description: '',
      is_active: true,
      is_default: false,
      
      // Company branding
      company_name: 'Webby Wonder',
      company_address: 'Mumbai, India',
      company_phone: '',
      company_email: '',
      company_logo_url: '',
      
      // Colors
      color_primary: '#2563eb',
      color_secondary: '#6b7280',
      color_accent: '#10b981',
      color_text: '#111827',
      color_background: '#ffffff',
      
      // Typography
      font_family: 'helvetica',
      font_size_base: 10,
      font_size_header: 16,
      font_size_title: 24,
      
      // Layout
      header_style: 'modern',
      item_table_style: 'modern',
      totals_layout: 'right',
      layout_columns: 'single',
      
      // Field visibility - show all by default
      show_invoice_number: true,
      show_issue_date: true,
      show_due_date: true,
      show_notes: true,
      show_terms: true,
      show_company_logo: true,
      show_company_details: true,
      show_client_details: true,
      show_line_items: true,
      show_subtotal: true,
      show_tax: true,
      show_discount: true,
      show_total: true,
      show_paid_amount: true,
      show_balance_due: true,
      
      // Custom styling
      custom_css: '',
    },
    validationSchema,

    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (id) {
          await templateService.updateTemplate(id, values);
          toast.success('Template updated successfully');
        } else {
          await templateService.createTemplate(values);
          toast.success('Template created successfully');
        }
        navigate('/templates');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to save template');
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch template if editing
  useEffect(() => {
    if (id) {
      const fetchTemplate = async () => {
        try {
          const template = await templateService.getTemplate(id);
          formik.setValues({
            ...template,
            show_invoice_number: template.show_invoice_number ?? true,
            show_issue_date: template.show_issue_date ?? true,
            show_due_date: template.show_due_date ?? true,
            show_notes: template.show_notes ?? true,
            show_terms: template.show_terms ?? true,
            show_company_logo: template.show_company_logo ?? true,
            show_company_details: template.show_company_details ?? true,
            show_client_details: template.show_client_details ?? true,
            show_line_items: template.show_line_items ?? true,
            show_subtotal: template.show_subtotal ?? true,
            show_tax: template.show_tax ?? true,
            show_discount: template.show_discount ?? true,
            show_total: template.show_total ?? true,
            show_paid_amount: template.show_paid_amount ?? true,
            show_balance_due: template.show_balance_due ?? true,
          });
        } catch (error) {
          toast.error('Failed to fetch template');
          navigate('/templates');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchTemplate();
    }
  }, [id]);

  const applyColorPreset = (preset) => {
    formik.setValues({
      ...formik.values,
      ...preset.colors,
    });
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Template' : 'Create New Template'}
        </h1>
        <p className="text-gray-600">
          Customize your invoice template design and layout
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                className="input-field"
                placeholder="My Custom Template"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Type <span className="text-red-500">*</span>
              </label>
              <select
                name="template_type"
                value={formik.values.template_type}
                onChange={formik.handleChange}
                className="input-field"
              >
                {templateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                rows={3}
                className="input-field"
                placeholder="Brief description of this template"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formik.values.is_active}
                  onChange={formik.handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formik.values.is_default}
                  onChange={formik.handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Set as default</span>
              </label>
            </div>
          </div>
        </div>

        {/* Company Branding */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Branding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formik.values.company_name}
                onChange={formik.handleChange}
                className="input-field"
                placeholder="Your Company Name"
              />
              {formik.touched.company_name && formik.errors.company_name && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.company_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Email
              </label>
              <input
                type="email"
                name="company_email"
                value={formik.values.company_email}
                onChange={formik.handleChange}
                className="input-field"
                placeholder="contact@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Phone
              </label>
              <input
                type="text"
                name="company_phone"
                value={formik.values.company_phone}
                onChange={formik.handleChange}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo URL
              </label>
              <input
                type="url"
                name="company_logo_url"
                value={formik.values.company_logo_url}
                onChange={formik.handleChange}
                className="input-field"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address
              </label>
              <textarea
                name="company_address"
                value={formik.values.company_address}
                onChange={formik.handleChange}
                rows={3}
                className="input-field"
                placeholder="123 Business St, City, State 12345"
              />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Colors</h2>
            <div className="flex space-x-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyColorPreset(preset)}
                  className="flex items-center space-x-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <div className="flex space-x-1">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: preset.colors.color_primary }}
                    ></div>
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: preset.colors.color_secondary }}
                    ></div>
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: preset.colors.color_accent }}
                    ></div>
                  </div>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  name="color_primary"
                  value={formik.values.color_primary}
                  onChange={formik.handleChange}
                  className="w-12 h-10 rounded border"
                />
                <input
                  type="text"
                  value={formik.values.color_primary}
                  onChange={formik.handleChange}
                  name="color_primary"
                  className="input-field flex-1"
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  name="color_secondary"
                  value={formik.values.color_secondary}
                  onChange={formik.handleChange}
                  className="w-12 h-10 rounded border"
                />
                <input
                  type="text"
                  value={formik.values.color_secondary}
                  onChange={formik.handleChange}
                  name="color_secondary"
                  className="input-field flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  name="color_accent"
                  value={formik.values.color_accent}
                  onChange={formik.handleChange}
                  className="w-12 h-10 rounded border"
                />
                <input
                  type="text"
                  value={formik.values.color_accent}
                  onChange={formik.handleChange}
                  name="color_accent"
                  className="input-field flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  name="color_text"
                  value={formik.values.color_text}
                  onChange={formik.handleChange}
                  className="w-12 h-10 rounded border"
                />
                <input
                  type="text"
                  value={formik.values.color_text}
                  onChange={formik.handleChange}
                  name="color_text"
                  className="input-field flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  name="color_background"
                  value={formik.values.color_background}
                  onChange={formik.handleChange}
                  className="w-12 h-10 rounded border"
                />
                <input
                  type="text"
                  value={formik.values.color_background}
                  onChange={formik.handleChange}
                  name="color_background"
                  className="input-field flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Typography</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family <span className="text-red-500">*</span>
              </label>
              <select
                name="font_family"
                value={formik.values.font_family}
                onChange={formik.handleChange}
                className="input-field"
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Size <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="font_size_base"
                value={formik.values.font_size_base}
                onChange={formik.handleChange}
                min="8"
                max="20"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Size <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="font_size_header"
                value={formik.values.font_size_header}
                onChange={formik.handleChange}
                min="10"
                max="24"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title Size <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="font_size_title"
                value={formik.values.font_size_title}
                onChange={formik.handleChange}
                min="14"
                max="36"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Layout</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Style <span className="text-red-500">*</span>
              </label>
              <select
                name="header_style"
                value={formik.values.header_style}
                onChange={formik.handleChange}
                className="input-field"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Table Style <span className="text-red-500">*</span>
              </label>
              <select
                name="item_table_style"
                value={formik.values.item_table_style}
                onChange={formik.handleChange}
                className="input-field"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Totals Layout <span className="text-red-500">*</span>
              </label>
              <select
                name="totals_layout"
                value={formik.values.totals_layout}
                onChange={formik.handleChange}
                className="input-field"
              >
                <option value="right">Right Aligned</option>
                <option value="left">Left Aligned</option>
                <option value="center">Center Aligned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout Columns <span className="text-red-500">*</span>
              </label>
              <select
                name="layout_columns"
                value={formik.values.layout_columns}
                onChange={formik.handleChange}
                className="input-field"
              >
                <option value="single">Single Column</option>
                <option value="two">Two Columns</option>
              </select>
            </div>
          </div>
        </div>

        {/* Field Visibility */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Visibility</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'show_invoice_number', label: 'Invoice Number' },
              { key: 'show_issue_date', label: 'Issue Date' },
              { key: 'show_due_date', label: 'Due Date' },
              { key: 'show_company_logo', label: 'Company Logo' },
              { key: 'show_company_details', label: 'Company Details' },
              { key: 'show_client_details', label: 'Client Details' },
              { key: 'show_line_items', label: 'Line Items' },
              { key: 'show_subtotal', label: 'Subtotal' },
              { key: 'show_tax', label: 'Tax' },
              { key: 'show_discount', label: 'Discount' },
              { key: 'show_total', label: 'Total' },
              { key: 'show_paid_amount', label: 'Paid Amount' },
              { key: 'show_balance_due', label: 'Balance Due' },
              { key: 'show_notes', label: 'Notes' },
              { key: 'show_terms', label: 'Terms & Conditions' },
            ].map((field) => (
              <label key={field.key} className="flex items-center">
                <input
                  type="checkbox"
                  name={field.key}
                  checked={formik.values[field.key]}
                  onChange={formik.handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{field.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom CSS */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom CSS</h2>
          <p className="text-sm text-gray-600 mb-4">
            Add custom CSS styles to further customize your template. Use with caution as this can affect the layout.
          </p>
          <textarea
            name="custom_css"
            value={formik.values.custom_css}
            onChange={formik.handleChange}
            rows={8}
            className="input-field font-mono text-sm"
            placeholder="/* Add your custom CSS here */
.invoice-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={loading || !formik.isValid}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Template' : 'Create Template'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateForm;
