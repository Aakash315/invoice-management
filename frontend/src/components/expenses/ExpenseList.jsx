import React, { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';

const ExpenseList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Fetch expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        search: searchTerm,
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
  }, [filters, searchTerm, pagination.page]);

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

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({
      ...prev,
      page: 1,
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
    setSearchTerm('');
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
      <div className="card p-6 mb-6">
        {/* Search Bar */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-field pl-10"
            />
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
              {searchTerm || Object.values(filters).some(v => v) 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first expense'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(v => v) && (
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
                            to={`/expenses/${expense.id}`}
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
