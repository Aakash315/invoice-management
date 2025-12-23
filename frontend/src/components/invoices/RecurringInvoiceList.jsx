import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recurringInvoiceService } from '../../services/recurringInvoiceService';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const RecurringInvoiceList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    is_active: '',
    frequency: '',
    client_id: '',
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, template: null });
  const [generateModal, setGenerateModal] = useState({ isOpen: false, template: null });
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, template: null });
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Filter out empty values to prevent 422 errors
      const cleanFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          cleanFilters[key] = filters[key];
        }
      });
      const data = await recurringInvoiceService.getAll(cleanFilters);
      setTemplates(data || []);
    } catch (error) {
      toast.error('Failed to fetch recurring invoice templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await recurringInvoiceService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchStats();
  }, [filters]);

  const handleDelete = async () => {
    if (deleteModal.template) {
      try {
        await recurringInvoiceService.delete(deleteModal.template.id);
        toast.success('Template deleted successfully');
        setTemplates(templates.filter((tpl) => tpl.id !== deleteModal.template.id));
        setDeleteModal({ isOpen: false, template: null });
        fetchStats(); // Refresh stats
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleToggleStatus = async (template) => {
    try {
      const updated = await recurringInvoiceService.toggleStatus(template.id);
      toast.success(`Template ${updated.is_active ? 'activated' : 'paused'} successfully`);
      setTemplates(templates.map(tpl => tpl.id === template.id ? updated : tpl));
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error('Failed to toggle template status');
    }
  };

  const handleGenerateInvoice = async (template) => {
    try {
      setGenerateModal({ isOpen: true, template });
    } catch (error) {
      toast.error('Failed to prepare invoice generation');
    }
  };

  const confirmGenerateInvoice = async () => {
    if (generateModal.template) {
      try {
        const result = await recurringInvoiceService.generateInvoice(generateModal.template.id);
        toast.success(`Invoice ${result.invoice_number} generated successfully`);
        setGenerateModal({ isOpen: false, template: null });
        fetchStats(); // Refresh stats
      } catch (error) {
        toast.error('Failed to generate invoice');
      }
    }
  };

  const handleGenerateDueInvoices = async () => {
    try {
      const result = await recurringInvoiceService.generateDueInvoices();
      toast.success(`Generated ${result.generated_invoices} invoices, ${result.failed_generations} failures`);
      fetchTemplates(); // Refresh list
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error('Failed to generate due invoices');
    }
  };

  const handlePreview = async (template) => {
    try {
      const preview = await recurringInvoiceService.getPreview(template.id, 5);
      setPreviewModal({ isOpen: true, template, preview: preview.next_due_dates || [] });
    } catch (error) {
      // Fallback to simple client-side preview
      const fallbackPreview = [];
      let currentDate = new Date(template.next_due_date);
      
      for (let i = 0; i < 5; i++) {
        fallbackPreview.push(new Date(currentDate));
        // Move to next date based on frequency
        if (template.frequency === 'daily') {
          currentDate.setDate(currentDate.getDate() + template.interval_value);
        } else if (template.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + (7 * template.interval_value));
        } else if (template.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + template.interval_value);
        } else if (template.frequency === 'quarterly') {
          currentDate.setMonth(currentDate.getMonth() + (3 * template.interval_value));
        } else if (template.frequency === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + template.interval_value);
        }
      }
      
      setPreviewModal({ isOpen: true, template, preview: fallbackPreview });
    }
  };

  const getFrequencyDisplay = (template) => {
    const frequency = template.frequency;
    const interval = template.interval_value;
    let display = '';
    
    if (interval === 1) {
      display = frequency.charAt(0).toUpperCase() + frequency.slice(1);
    } else {
      display = `Every ${interval} ${frequency}${interval > 1 ? 's' : ''}`;
    }
    
    // Add specific day information
    if (frequency === 'weekly' && template.day_of_week !== null) {
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      display += ` on ${dayNames[template.day_of_week]}`;
    } else if (frequency === 'monthly' && template.day_of_month !== null) {
      display += ` on day ${template.day_of_month}`;
    }
    
    return display;
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Paused';
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Recurring Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage automated invoice templates with scheduled generation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-secondary flex items-center"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            {showStats ? 'Hide' : 'Show'} Stats
          </button>
          <button
            onClick={handleGenerateDueInvoices}
            className="btn-secondary flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Generate Due
          </button>
          <Link to="/recurring-invoices/new" className="btn-primary flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Template
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">{stats.total_templates}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_templates}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">{stats.active_templates}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Templates</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active_templates}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{stats.total_generated}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Generated Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_generated}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold text-sm">{stats.templates_with_auto_send}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto-Send Enabled</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.templates_with_auto_send}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-5">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={filters.is_active}
            onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Paused</option>
          </select>

          <select
            value={filters.frequency}
            onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}
            className="input-field"
          >
            <option value="">All Frequencies</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          {(filters.is_active || filters.frequency) && (
            <button
              onClick={() => setFilters({ is_active: '', frequency: '', client_id: '' })}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Templates Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/recurring-invoices/view/${template.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      {template.template_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {template.client?.name || 'N/A'}
                    </div>
                    {template.client?.company && (
                      <div className="text-sm text-gray-500">
                        {template.client.company}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getFrequencyDisplay(template)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Since {format(new Date(template.start_date), 'dd MMM yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(template.next_due_date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(template.is_active)}`}
                    >
                      {getStatusText(template.is_active)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {template.generation_count} generated
                    </div>
                    {template.failed_generations > 0 && (
                      <div className="text-sm text-red-600">
                        {template.failed_generations} failed
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/recurring-invoices/view/${template.id}`)}
                        className="text-primary-600 hover:text-primary-700"
                        title="View"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePreview(template)}
                        className="text-purple-600 hover:text-purple-700"
                        title="Preview Upcoming"
                      >
                        <CalendarDaysIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/recurring-invoices/edit/${template.id}`)}
                        className="text-gray-600 hover:text-gray-700"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(template)}
                        className={`${template.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                        title={template.is_active ? 'Pause' : 'Activate'}
                      >
                        {template.is_active ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleGenerateInvoice(template)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Generate Invoice"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, template })}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No recurring invoice templates found</p>
              <Link
                to="/recurring-invoices/new"
                className="btn-primary inline-flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Template
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, template: null })}
        onConfirm={handleDelete}
        title="Delete Template"
        message={`Are you sure you want to delete template "${deleteModal.template?.template_name}"? This action cannot be undone.`}
      />

      {/* Generate Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={generateModal.isOpen}
        onClose={() => setGenerateModal({ isOpen: false, template: null })}
        onConfirm={confirmGenerateInvoice}
        title="Generate Invoice"
        message={`Are you sure you want to generate an invoice from template "${generateModal.template?.template_name}"? This will create a new invoice with the current date.`}
      />

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Upcoming Invoices Preview
              </h3>
              <button
                onClick={() => setPreviewModal({ isOpen: false, template: null, preview: [] })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{previewModal.template?.template_name}</h4>
              <p className="text-sm text-gray-600">
                {getFrequencyDisplay(previewModal.template)}
              </p>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {previewModal.preview && previewModal.preview.length > 0 ? (
                previewModal.preview.map((date, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">
                      Invoice #{index + 1}
                    </span>
                    <span className="text-sm text-gray-600">
                      {format(new Date(date), 'dd MMM yyyy')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming dates available</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPreviewModal({ isOpen: false, template: null, preview: [] })}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringInvoiceList;
