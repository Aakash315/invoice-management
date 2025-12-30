import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { recurringInvoiceService } from '../../services/recurringInvoiceService';
import { clientService } from '../../services/clientService';
import { PlusIcon, TrashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const RecurringInvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    template_name: '',
    client_id: '',
    frequency: 'monthly',
    interval_value: 1,
    day_of_week: 1, // Default to Tuesday (1)
    day_of_month: 1, // Default to 1st
    start_date: '',
    end_date: '',
    occurrences_limit: '',
    is_active: true,
    auto_send: false,
    email_subject: '',
    email_message: '',
    tax_enabled: false,
    tax_rate: 0,
    items: [],
  });

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [previewDates, setPreviewDates] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchClients();
    if (isEdit) {
      fetchTemplate();
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data || []);
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchTemplate = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const template = await recurringInvoiceService.getById(id);
      const hasTax = template.tax_rate && template.tax_rate > 0;
      setFormData({
        template_name: template.template_name,
        client_id: template.client_id,
        frequency: template.frequency,
        interval_value: template.interval_value,
        day_of_week: template.day_of_week || 1,
        day_of_month: template.day_of_month || 1,
        start_date: template.start_date,
        end_date: template.end_date || '',
        occurrences_limit: template.occurrences_limit || '',
        is_active: template.is_active,
        auto_send: template.auto_send,
        email_subject: template.email_subject || '',
        email_message: template.email_message || '',
        tax_enabled: hasTax,
        tax_rate: template.tax_rate || 0,
        items: template.template_items?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
        })) || [],
      });
    } catch (error) {
      toast.error('Failed to fetch template');
      navigate('/recurring-invoices');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateItemAmount = (item) => {
    return (item.quantity || 0) * (item.rate || 0);
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  };

  const calculateTaxAmount = () => {
    if (!formData.tax_enabled) return 0;
    return calculateSubtotal() * ((formData.tax_rate || 0) / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  const handleTaxToggle = (e) => {
    const enabled = e.target.checked;
    setFormData(prev => ({
      ...prev,
      tax_enabled: enabled,
      tax_rate: enabled && prev.tax_rate === 0 ? 18 : prev.tax_rate
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.template_name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!formData.client_id) {
      toast.error('Client is required');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    // Validate items
    const invalidItems = formData.items.filter(item => 
      !item.description.trim() || item.quantity <= 0 || item.rate < 0
    );

    if (invalidItems.length > 0) {
      toast.error('All items must have description, positive quantity, and non-negative rate');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.start_date);
    const endDate = formData.end_date ? new Date(formData.end_date) : null;
    
    if (startDate <= new Date()) {
      toast.error('Start date must be in the future');
      return;
    }

    if (endDate && endDate <= startDate) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        interval_value: parseInt(formData.interval_value),
        day_of_week: formData.frequency === 'weekly' ? parseInt(formData.day_of_week) : null,
        day_of_month: formData.frequency === 'monthly' ? parseInt(formData.day_of_month) : null,
        occurrences_limit: formData.occurrences_limit ? parseInt(formData.occurrences_limit) : null,
        client_id: parseInt(formData.client_id),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        tax_rate: formData.tax_enabled ? formData.tax_rate : 0,
        items: formData.items.map(item => ({
          ...item,
          quantity: parseInt(item.quantity),
          rate: parseFloat(item.rate),
        })),
      };

      if (isEdit) {
        await recurringInvoiceService.update(id, submitData);
        toast.success('Template updated successfully');
      } else {
        await recurringInvoiceService.create(submitData);
        toast.success('Template created successfully');
      }
      
      navigate('/recurring-invoices');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!formData.start_date || !formData.frequency) {
      toast.error('Please set start date and frequency first');
      return;
    }

    try {
      const response = await fetch('/api/recurring-invoices/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: formData.start_date,
          frequency: formData.frequency,
          interval_value: parseInt(formData.interval_value),
          day_of_week: formData.frequency === 'weekly' ? parseInt(formData.day_of_week) : null,
          day_of_month: formData.frequency === 'monthly' ? parseInt(formData.day_of_month) : null,
          count: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewDates(data.next_due_dates || []);
        setShowPreview(true);
      }
    } catch (error) {
      // For now, just show a simple preview
      const preview = [];
      let currentDate = new Date(formData.start_date);
      
      for (let i = 0; i < 5; i++) {
        // Simple calculation for preview (backend will have the exact logic)
        if (formData.frequency === 'daily') {
          currentDate.setDate(currentDate.getDate() + formData.interval_value);
        } else if (formData.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + (7 * formData.interval_value));
        } else if (formData.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + formData.interval_value);
        } else if (formData.frequency === 'quarterly') {
          currentDate.setMonth(currentDate.getMonth() + (3 * formData.interval_value));
        } else if (formData.frequency === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + formData.interval_value);
        }
        preview.push(new Date(currentDate));
      }
      
      setPreviewDates(preview);
      setShowPreview(true);
    }
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Recurring Invoice Template' : 'Create Recurring Invoice Template'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isEdit 
              ? 'Update your recurring invoice template settings'
              : 'Create an automated invoice template that generates invoices on a schedule'
            }
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/recurring-invoices')}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="card p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Monthly Service Invoice"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                {clientsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
                ) : (
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active (template will generate invoices when due)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Recurrence Settings */}
          <div className="card p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recurrence Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Every (interval)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.interval_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, interval_value: e.target.value }))}
                  className="input-field"
                  placeholder="1"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.frequency === 'daily' && 'days'}
                  {formData.frequency === 'weekly' && 'weeks'}
                  {formData.frequency === 'monthly' && 'months'}
                  {formData.frequency === 'quarterly' && 'quarters'}
                  {formData.frequency === 'yearly' && 'years'}
                </p>
              </div>

              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week *
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: e.target.value }))}
                    className="input-field"
                    required
                  >
                    {dayNames.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Month *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) => setFormData(prev => ({ ...prev, day_of_month: e.target.value }))}
                    className="input-field"
                    placeholder="1"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occurrences Limit (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.occurrences_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, occurrences_limit: e.target.value }))}
                  className="input-field"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <button
                type="button"
                onClick={handlePreview}
                className="btn-secondary flex items-center"
              >
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Preview Upcoming Dates
              </button>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="md:col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="input-field"
                    placeholder="Description"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="input-field"
                    placeholder="Qty"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', e.target.value)}
                    className="input-field"
                    placeholder="Rate"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={calculateItemAmount(item).toFixed(2)}
                    className="input-field bg-gray-50"
                    placeholder="Amount"
                    readOnly
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            {formData.items.length > 0 && (
              <div className="text-right pt-4 border-t border-gray-200">
                <p className="text-lg font-semibold text-gray-900">
                  Subtotal: ₹{calculateSubtotal().toFixed(2)}
                </p>
                {formData.tax_enabled && formData.tax_rate > 0 && (
                  <p className="text-sm text-gray-600">
                    Tax ({formData.tax_rate}%): ₹{calculateTaxAmount().toFixed(2)}
                  </p>
                )}
                <p className="text-xl font-bold text-gray-900">
                  Total: ₹{calculateTotal().toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tax Settings */}
        <div className="card p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="tax_enabled"
                checked={formData.tax_enabled}
                onChange={handleTaxToggle}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="tax_enabled" className="ml-2 text-sm text-gray-700">
                Enable Tax
              </label>
            </div>

            {formData.tax_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                  className="input-field max-w-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Email Settings */}
        <div className="card p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Settings (Optional)</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_send"
                checked={formData.auto_send}
                onChange={(e) => setFormData(prev => ({ ...prev, auto_send: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="auto_send" className="ml-2 text-sm text-gray-700">
                Auto-send generated invoices via email
              </label>
            </div>

            {formData.auto_send && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={formData.email_subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_subject: e.target.value }))}
                    className="input-field"
                    placeholder="e.g., Invoice {invoice_number} from {company_name}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Message
                  </label>
                  <textarea
                    value={formData.email_message}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_message: e.target.value }))}
                    className="input-field"
                    rows={4}
                    placeholder="Custom message to include in the email..."
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Invoice Dates</h3>
            <div className="space-y-2">
              {previewDates.map((date, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-900">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</span>
                  <span className="text-sm text-gray-500">Invoice #{index + 1}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="mt-4 btn-secondary"
            >
              Close Preview
            </button>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/recurring-invoices')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Template' : 'Create Template')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecurringInvoiceForm;

