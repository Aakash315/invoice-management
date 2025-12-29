import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { expenseService } from '../../services/expenseService';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ExpenseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExpense = useCallback(async () => {
    try {
      setLoading(true);
      const data = await expenseService.getExpense(id);
      setExpense(data);
    } catch (error) {
      toast.error('Failed to fetch expense');
      navigate('/expenses');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchExpense();
  }, [id, fetchExpense]);

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

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || colors.draft;
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      'Cash': 'bg-green-100 text-green-800',
      'Credit Card': 'bg-blue-100 text-blue-800',
      'Debit Card': 'bg-purple-100 text-purple-800',
      'Bank Transfer': 'bg-indigo-100 text-indigo-800',
      'Check': 'bg-yellow-100 text-yellow-800',
      'Digital Wallet': 'bg-pink-100 text-pink-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!expense) return null;

  const currencySymbol = getCurrencySymbol(expense.currency);

  return (
    <div className="max-w-5xl mx-auto space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/expenses')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {expense.description || 'Expense Details'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Created on {format(new Date(expense.created_at), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="btn-secondary flex items-center"
            title="Export to PDF"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export PDF
          </button>
          <Link
            to={`/expenses/${id}/edit`}
            className="btn-primary flex items-center"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Main Expense Card */}
      <div className="card p-8">
        {/* Status and Amount Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <span
              className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(
                expense.status || 'draft'
              )}`}
            >
              {expense.status || 'Draft'}
            </span>
            {expense.is_tax_deductible && (
              <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800">
                Tax Deductible
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {currencySymbol}{expense.amount.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              {expense.currency}
            </div>
          </div>
        </div>

        {/* Expense Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-primary-600" />
                Expense Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Description:</span>
                  <span className="text-sm text-gray-900">{expense.description}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Amount:</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {currencySymbol}{expense.amount.toFixed(2)} {expense.currency}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Date:</span>
                  <span className="text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {format(new Date(expense.date), 'dd MMM yyyy')}
                  </span>
                </div>

                {expense.category && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Category:</span>
                    <span className="text-sm text-gray-900 flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {expense.category.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Vendor Information */}
            {expense.vendor && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Vendor Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Vendor:</span>
                    <span className="text-sm text-gray-900">{expense.vendor}</span>
                  </div>

                  {expense.vendor_contact && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Contact:</span>
                      <span className="text-sm text-gray-900">{expense.vendor_contact}</span>
                    </div>
                  )}

                  {expense.vendor_address && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Address:</span>
                      <div className="text-sm text-gray-900 mt-1">
                        {expense.vendor_address}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="space-y-6">
            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2 text-primary-600" />
                Payment Information
              </h3>
              
              <div className="space-y-4">
                {expense.payment_method && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(expense.payment_method)}`}>
                      {expense.payment_method}
                    </span>
                  </div>
                )}

                {expense.reference_number && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Reference Number:</span>
                    <span className="text-sm text-gray-900 font-mono">{expense.reference_number}</span>
                  </div>
                )}

                {expense.payment_date && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Payment Date:</span>
                    <span className="text-sm text-gray-900 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {format(new Date(expense.payment_date), 'dd MMM yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Information
              </h3>
              
              <div className="space-y-4">
                {expense.location && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Location:</span>
                    <span className="text-sm text-gray-900">{expense.location}</span>
                  </div>
                )}

                {expense.tags && expense.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {expense.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {expense.receipt_url && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Receipt:</span>
                    <div className="mt-1">
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-900 flex items-center"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                        View Receipt
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {expense.notes && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{expense.notes}</p>
          </div>
        )}

        {/* Tax Information */}
        {expense.is_tax_deductible && (
          <div className="mt-6 pt-6 border-t">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-green-800">
                  <strong>Tax Deductible:</strong> This expense is marked as tax deductible and can be included in tax calculations.
                  {expense.tax_deductible_amount && (
                    <span className="ml-1">
                      (Amount: {currencySymbol}{expense.tax_deductible_amount.toFixed(2)})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-8 pt-6 border-t text-xs text-gray-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Created:</span> {format(new Date(expense.created_at), 'dd MMM yyyy, hh:mm a')}
            </div>
            {expense.updated_at && expense.updated_at !== expense.created_at && (
              <div>
                <span className="font-medium">Last Updated:</span> {format(new Date(expense.updated_at), 'dd MMM yyyy, hh:mm a')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Perform common actions on this expense
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to={`/expenses/${id}/edit`}
              className="btn-secondary flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={() => {
                // TODO: Implement duplicate functionality
                toast.info('Duplicate functionality coming soon!');
              }}
              className="btn-secondary flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Duplicate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseView;
