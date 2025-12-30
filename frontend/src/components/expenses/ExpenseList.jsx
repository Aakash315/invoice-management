import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { expenseService } from '../../services/expenseService';
import { expenseCategoryService } from '../../services/expenseCategoryService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const ExpenseList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('expenseSearchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [filters, setFilters] = useState({
    category_id: '',
    payment_method: '',
    start_date: '',
    end_date: '',
    min_amount: '',
    max_amount: '',
    client_id: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Maximum number of search history items to store
  const MAX_HISTORY_ITEMS = 10;

  // Save search history to localStorage
  useEffect(() => {
    localStorage.setItem('expenseSearchHistory', JSON.stringify(searchHistory));
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
      setPagination(prev => ({
        ...prev,
        page: 1,
      }));
    }
  };

  // Handle clicking on a history item
  const handleHistoryItemClick = (term) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  // Fetch expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        search: searchQuery,
        skip: (pagination.page - 1) * pagination.limit,
        limit: pagination.limit,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await expenseService.getExpenses(params);
      setExpenses(response);
      
      // Update pagination if total is available in response
      if (response.total !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: response.total,
          totalPages: Math.ceil(response.total / prev.limit),
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filter dropdown
  const fetchCategories = async () => {
    try {
      const categoriesData = await expenseCategoryService.getExpenseCategories();
      setCategories(categoriesData || []);
    } catch (error) {
      console.warn('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch expenses when filters change
  useEffect(() => {
    fetchExpenses();
  }, [filters, pagination.page]);

  // Sync search query with filters for API call
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
    }));
  }, [searchQuery]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({
      ...prev,
      page: 1, // Reset to first page when filtering
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category_id: '',
      payment_method: '',
      start_date: '',
      end_date: '',
      min_amount: '',
      max_amount: '',
      client_id: '',
    });
    setSearchQuery('');
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  // Export expenses to CSV
  const handleExport = async () => {
    try {
      await expenseService.exportExpensesCSV(filters);
      toast.success('Expenses exported successfully');
    } catch (error) {
      toast.error('Failed to export expenses');
    }
  };

  // Delete expense
  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      toast.success('Expense deleted successfully');
      fetchExpenses(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) {
      toast.error('Please select expenses to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedExpenses.length} expenses?`)) {
      return;
    }

    try {
      await expenseService.bulkDeleteExpenses(selectedExpenses);
      toast.success(`${selectedExpenses.length} expenses deleted successfully`);
      setSelectedExpenses([]);
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expenses');
    }
  };

  // Toggle expense selection
  const toggleExpenseSelection = (expenseId) => {
    setSelectedExpenses(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  };

  // Select all expenses
  const toggleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map(expense => expense.id));
    }
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
    };
    return symbols[currency] || currency;
  };

  // Refresh expenses when returning from create/edit
  useEffect(() => {
    if (location.state?.refresh) {
      fetchExpenses();
      // Clear the refresh flag
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="max-w-7xl mx-auto mt-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <Link to="/expenses/new" className="btn-primary flex items-center">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Expense
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 mb-6 overflow-visible">
        {/* Search Bar */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative" ref={searchRef}>
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search expenses by description, vendor, category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="input-field pl-10 pr-20"
              />
            </form>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center ${showFilters ? 'bg-primary-100 border-primary-300' : ''}`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={filters.payment_method}
                  onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Digital Wallet">Digital Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Amount
                </label>
                <input
                  type="number"
                  value={filters.min_amount}
                  onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Amount
                </label>
                <input
                  type="number"
                  value={filters.max_amount}
                  onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex items-center justify-end mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedExpenses.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-800">
              {selectedExpenses.length} expense{selectedExpenses.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkDelete}
                className="btn-danger text-sm flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedExpenses([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || Object.values(filters).some(v => v) 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first expense'
              }
            </p>
            {!searchQuery && !Object.values(filters).some(v => v) && (
              <div className="mt-6">
                <Link to="/expenses/new" className="btn-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Expense
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={() => toggleExpenseSelection(expense.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {expense.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {expense.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.payment_method || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.vendor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/expenses/view/${expense.id}`}
                            className="text-primary-600 hover:text-primary-900"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/expenses/${expense.id}/edit`}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
