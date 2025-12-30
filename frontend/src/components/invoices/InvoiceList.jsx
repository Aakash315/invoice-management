
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { invoiceService } from '../../services/invoiceService';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import RecurringBadge from '../common/RecurringBadge';


const InvoiceList = () => {

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    recurring: '', // '', 'true', 'false'
    currency: '',
    search: '',
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, invoice: null });
  const navigate = useNavigate();
  const location = useLocation();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAll(filters);
      setInvoices(data || []);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  // Check for navigation state from form submissions
  const shouldRefresh = location.state?.refresh || sessionStorage.getItem('invoiceUpdated') === 'true';

  // Sync search query with filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
  }, [searchQuery]);

  useEffect(() => {
    // Clear the session storage flag if it exists
    if (sessionStorage.getItem('invoiceUpdated') === 'true') {
      sessionStorage.removeItem('invoiceUpdated');
    }
    fetchInvoices();
  }, [filters, shouldRefresh]);

  const handleDelete = async () => {
    if (deleteModal.invoice) {
      try {
        await invoiceService.delete(deleteModal.invoice.id);
        toast.success('Invoice deleted successfully');
        setInvoices(invoices.filter((inv) => inv.id !== deleteModal.invoice.id));
        setDeleteModal({ isOpen: false, invoice: null });
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.draft;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      unpaid: 'text-red-600',
      partial: 'text-yellow-600',
      paid: 'text-green-600',
    };
    return colors[status] || colors.unpaid;
  };

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'INR':
        return '₹';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return '';
    }
  };

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link to="/invoices/new" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices by number, client name, company, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center space-x-4">
          {/* Filter Dropdowns */}
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.payment_status}
            onChange={(e) =>
              setFilters({ ...filters, payment_status: e.target.value })
            }
            className="input-field"
          >
            <option value="">All Payment Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>

          <select
            value={filters.currency}
            onChange={(e) =>
              setFilters({ ...filters, currency: e.target.value })
            }
            className="input-field"
          >
            <option value="">All Currencies</option>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>

          <select
            value={filters.recurring}
            onChange={(e) =>
              setFilters({ ...filters, recurring: e.target.value })
            }
            className="input-field"
          >
            <option value="">All Invoices</option>
            <option value="true">Recurring Only</option>
            <option value="false">Manual Only</option>
          </select>

          {(filters.status || filters.payment_status || filters.recurring || filters.currency) && (
            <button
              onClick={() => setFilters({ status: '', payment_status: '', recurring: '', currency: '' })}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
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
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <Link
                        to={`/invoices/view/${invoice.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {invoice.invoice_number}
                      </Link>
                      {invoice.generated_by_template && (
                        <RecurringBadge
                          template={invoice.template}
                          generatedDate={invoice.created_at}
                          size="sm"
                          showTemplateLink={true}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.client?.name || 'N/A'}
                    </div>
                    {invoice.client?.company && (
                      <div className="text-sm text-gray-500">
                        {invoice.client.company}
                      </div>
                    )}
                    {invoice.generated_by_template && invoice.template && (
                      <div className="text-xs text-blue-600 mt-1">
                        From: {invoice.template.template_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(invoice.issue_date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(invoice.due_date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getCurrencySymbol(invoice.currency)}{invoice.total_amount.toLocaleString()}
                    </div>
                    {invoice.balance > 0 && (
                      <div className="text-sm text-gray-500">
                        Balance: {getCurrencySymbol(invoice.currency)}{invoice.balance.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${getPaymentStatusColor(
                        invoice.payment_status
                      )}`}
                    >
                      {invoice.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/invoices/view/${invoice.id}`)}
                        className="text-primary-600 hover:text-primary-700"
                        title="View"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      {invoice.generated_by_template && invoice.template && (
                        <button
                          onClick={() => navigate(`/recurring-invoices/view/${invoice.template.id}`)}
                          className="text-blue-600 hover:text-blue-700"
                          title="View Template"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                        className="text-gray-600 hover:text-gray-700"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, invoice })}
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

          {invoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No invoices found</p>
              <Link
                to="/invoices/new"
                className="btn-primary inline-flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Invoice
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, invoice: null })}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteModal.invoice?.invoice_number}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default InvoiceList;