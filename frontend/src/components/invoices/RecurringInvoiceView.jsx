import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { recurringInvoiceService } from '../../services/recurringInvoiceService';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const RecurringInvoiceView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [history, setHistory] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, template: null });
  const [generateModal, setGenerateModal] = useState({ isOpen: false, template: null });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchTemplate();
      fetchHistory();
      fetchPreview();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const data = await recurringInvoiceService.getById(id);
      setTemplate(data);
    } catch (error) {
      toast.error('Failed to fetch template');
      navigate('/recurring-invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await recurringInvoiceService.getHistory(id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchPreview = async () => {
    try {
      const data = await recurringInvoiceService.getPreview(id, 10);
      setPreview(data.next_due_dates || []);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!template) return;
    
    try {
      const updated = await recurringInvoiceService.toggleStatus(template.id);
      setTemplate(updated);
      toast.success(`Template ${updated.is_active ? 'activated' : 'paused'} successfully`);
    } catch (error) {
      toast.error('Failed to toggle template status');
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const result = await recurringInvoiceService.generateInvoice(template.id);
      toast.success(`Invoice ${result.invoice_number} generated successfully`);
      setGenerateModal({ isOpen: false, template: null });
      fetchHistory(); // Refresh history
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleDelete = async () => {
    try {
      await recurringInvoiceService.delete(template.id);
      toast.success('Template deleted successfully');
      navigate('/recurring-invoices');
    } catch (error) {
      toast.error('Failed to delete template');
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

  const calculateSubtotal = () => {
    if (!template?.template_items) return 0;
    return template.template_items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Template not found</p>
        <Link to="/recurring-invoices" className="btn-primary mt-4">
          Back to Recurring Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/recurring-invoices')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.template_name}</h1>
            <p className="mt-1 text-sm text-gray-600">
              Recurring invoice template for {template.client?.name || 'Unknown Client'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleStatus}
            className={`btn-secondary flex items-center ${template.is_active ? 'text-yellow-600' : 'text-green-600'}`}
          >
            {template.is_active ? <PauseIcon className="h-5 w-5 mr-2" /> : <PlayIcon className="h-5 w-5 mr-2" />}
            {template.is_active ? 'Pause' : 'Activate'}
          </button>
          <button
            onClick={() => setGenerateModal({ isOpen: true, template })}
            className="btn-secondary flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Generate Now
          </button>
          <Link to={`/recurring-invoices/edit/${template.id}`} className="btn-primary flex items-center">
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                template.is_active ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <span className={`font-semibold text-sm ${
                  template.is_active ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {template.is_active ? 'A' : 'P'}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {template.is_active ? 'Active' : 'Paused'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Next Due</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(template.next_due_date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Generated</p>
              <p className="text-lg font-semibold text-gray-900">
                {template.generation_count} invoices
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Auto-Send</p>
              <p className="text-lg font-semibold text-gray-900">
                {template.auto_send ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            History ({history.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Details */}
          <div className="card p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4"><u>Template Details</u></h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700"><strong>Template Name</strong></label>
                <p className="mt-1 text-sm text-gray-900">{template.template_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700"><strong>Client</strong></label>
                <p className="mt-1 text-sm text-gray-900">
                  {template.client?.name || 'Unknown Client'}
                  {template.client?.company && (
                    <span className="text-gray-500"> ({template.client.company})</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{template.client?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700"><strong>Frequency</strong></label>
                <p className="mt-1 text-sm text-gray-900">{getFrequencyDisplay(template)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(template.start_date), 'MMM dd, yyyy')} - 
                  {template.end_date ? format(new Date(template.end_date), 'MMM dd, yyyy') : 'No end date'}
                </p>
              </div>

              {template.occurrences_limit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Occurrences Limit</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {template.current_occurrence} / {template.occurrences_limit} generated
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="card p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4"><u>Invoice Items</u></h3>
            
            <div className="space-y-3">
              {template.template_items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × ₹{item.rate.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ₹{item.amount.toFixed(2)}
                  </div>
                </div>
              ))}

              {template.template_items?.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Tax (18%):</span>
                    <span className="text-sm font-medium text-gray-900">₹{calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-semibold text-gray-900">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="card p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Invoice Dates</h3>
          
          <div className="space-y-3">
            {preview.length > 0 ? (
              preview.map((date, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Invoice #{index + 1}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))} days from now
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming dates available</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Invoices</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/invoices/view/${invoice.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(invoice.issue_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(invoice.due_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{invoice.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        invoice.payment_status === 'paid' ? 'text-green-600' :
                        invoice.payment_status === 'partial' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {invoice.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/invoices/view/${invoice.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {history.length === 0 && (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices generated</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This template hasn't generated any invoices yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, template: null })}
        onConfirm={handleDelete}
        title="Delete Template"
        message={`Are you sure you want to delete template "${template.template_name}"? This action cannot be undone and will affect all future invoice generation.`}
      />

      {/* Generate Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={generateModal.isOpen}
        onClose={() => setGenerateModal({ isOpen: false, template: null })}
        onConfirm={handleGenerateInvoice}
        title="Generate Invoice Now"
        message={`Are you sure you want to generate an invoice from template "${template.template_name}"? This will create a new invoice with today's date.`}
      />

      {/* Danger Zone */}
      <div className="card p-5 border-red-200">
        <h3 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-700 mb-4">
          These actions are irreversible. Please be careful.
        </p>
        <button
          onClick={() => setDeleteModal({ isOpen: true, template })}
          className="btn-danger flex items-center"
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          Delete Template
        </button>
      </div>
    </div>
  );
};

export default RecurringInvoiceView;
