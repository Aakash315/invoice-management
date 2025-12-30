
import React, { useState, useEffect, useRef } from 'react';
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
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import RecurringBadge from '../common/RecurringBadge';


const InvoiceList = () => {

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('invoiceSearchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    recurring: '', // '', 'true', 'false'
    currency: '',
    search: '',
    date_range: '',
    date_from: '',
    date_to: '',
    amount_range: '',
    amount_min: '',
    amount_max: '',
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, invoice: null });
  const navigate = useNavigate();
  const location = useLocation();

  // Maximum number of search history items to store
  const MAX_HISTORY_ITEMS = 10;

  // Save search history to localStorage
  useEffect(() => {
    localStorage.setItem('invoiceSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Handle click outside to close search history dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add search term to history
  const addToSearchHistory = (term) => {
    if (!term || term.trim() === '') return;
    
    const trimmedTerm = term.trim();
    setSearchHistory(prev => {
      // Remove duplicates (case insensitive)
      const filtered = prev.filter(item => 
        item.toLowerCase() !== trimmedTerm.toLowerCase()
      );
      // Add new term at the beginning and limit size
      return [trimmedTerm, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  // Remove single item from history
  const removeFromSearchHistory = (term, e) => {
    e.stopPropagation();
    setSearchHistory(prev => prev.filter(item => item !== term));
  };

  // Clear all search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    toast.success('Search history cleared');
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      addToSearchHistory(searchQuery);
      setIsSearchFocused(false);
    }
  };

  // Handle clicking on a history item
  const handleHistoryItemClick = (term) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
  };

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

  /* ---------------- DATE & AMOUNT FILTER HELPERS ---------------- */

  const getDateRange = (range) => {
    const now = new Date();
    let start, end;

    switch (range) {
      case 'this_week':
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        end = new Date();
        break;

      case 'this_month':
        start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        end = new Date();
        break;

      case 'last_quarter':
        const quarter = Math.floor((new Date().getMonth() + 3) / 3) - 1;
        start = new Date(new Date().getFullYear(), quarter * 3 - 3, 1);
        end = new Date(new Date().getFullYear(), quarter * 3, 0);
        break;

      default:
        return {};
    }

    return {
      date_from: start.toISOString().split('T')[0],
      date_to: end.toISOString().split('T')[0],
    };
  };


  const handleDateRangeChange = (value) => {
    if (value === 'custom') {
      setFilters({ ...filters, date_range: value });
    } else if (value === '') {
      // Reset date filters when "All Dates" is selected
      setFilters({ ...filters, date_range: '', date_from: '', date_to: '' });
    } else {
      const range = getDateRange(value);
      setFilters({ ...filters, date_range: value, ...range });
    }
  };

  const handleAmountRangeChange = (value) => {
    if (value === '') {
      // Reset amount filters when "All Amounts" is selected
      setFilters({
        ...filters,
        amount_range: '',
        amount_min: '',
        amount_max: ''
      });
      return;
    }

    let min = '', max = '';

    if (value === '0-10000') {
      min = 0; max = 10000;
    } else if (value === '10000-50000') {
      min = 10000; max = 50000;
    } else if (value === '50000+') {
      min = 50000;
    }

    setFilters({
      ...filters,
      amount_range: value,
      amount_min: min,
      amount_max: max
    });
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
      <div className="card p-5 overflow-visible">
        <div className="space-y-4">
          {/* Search Bar with History */}
          <div className="relative" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search invoices by number, client name, company, status..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="block w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </form>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              ) : (
                <span className="text-gray-300 text-xs border border-gray-300 rounded px-1.5 py-0.5">Enter</span>
              )}
            </div>
            
            {/* Search History Dropdown */}
            {isSearchFocused && (searchHistory.length > 0 || searchQuery.length > 0) && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                {searchHistory.length > 0 ? (
                  <>
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Recent searches
                      </div>
                      <button
                        onClick={clearSearchHistory}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center"
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Clear all
                      </button>
                    </div>
                    <ul>
                      {searchHistory.map((term, index) => (
                        <li
                          key={`${term}-${index}`}
                          onClick={() => handleHistoryItemClick(term)}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                        >
                          <span className="text-sm text-gray-700">{term}</span>
                          <button
                            onClick={(e) => removeFromSearchHistory(term, e)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-gray-500">
                    No recent searches yet
                  </div>
                )}
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

      <div className="card p-5">
        <div className="flex items-center space-x-4">
          {/* Filter Dropdowns */}
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          {/* Date Range Filter */}
          <select
            value={filters.date_range}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="input-field"
          >
            <option value="">All Dates</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_quarter">Last Quarter</option>
            <option value="custom">Custom</option>
          </select>

          {filters.date_range === 'custom' && (
            <>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="input-field"
              />
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="input-field"
              />
            </>
          )}

          {/* Amount Range */}
          <select
            value={filters.amount_range}
            onChange={(e) => handleAmountRangeChange(e.target.value)}
            className="input-field"
          >
            <option value="">All Amounts</option>
            <option value="0-10000">₹0 – ₹10,000</option>
            <option value="10000-50000">₹10,000 – ₹50,000</option>
            <option value="50000+">₹50,000+</option>
            <option value="custom">Custom</option>
          </select>

          {filters.amount_range === 'custom' && (
            <>
              <input
                type="number"
                placeholder="Min"
                value={filters.amount_min}
                onChange={(e) =>
                  setFilters({ ...filters, amount_min: e.target.value })
                }
                className="input-field"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.amount_max}
                onChange={(e) =>
                  setFilters({ ...filters, amount_max: e.target.value })
                }
                className="input-field"
              />
            </>
          )}

          {(filters.date_range || filters.amount_range) && (
            <button
              onClick={() => setFilters({ 
                date_range: '', 
                date_from: '', 
                date_to: '',
                amount_range: '', 
                amount_min: '', 
                amount_max: '' 
              })}
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