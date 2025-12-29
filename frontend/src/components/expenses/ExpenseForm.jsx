import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { expenseService } from '../../services/expenseService';
import { expenseCategoryService } from '../../services/expenseCategoryService';
import { clientService } from '../../services/clientService';
import { invoiceService } from '../../services/invoiceService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const ExpenseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [receiptFile, setReceiptFile] = useState(null);

  const validationSchema = Yup.object({
    amount: Yup.number()
      .required('Amount is required')
      .min(0.01, 'Amount must be greater than 0'),
    category_id: Yup.number()
      .required('Category is required'),
    date: Yup.date()
      .required('Date is required'),
    description: Yup.string()
      .required('Description is required')
      .max(500, 'Description must be less than 500 characters'),
    vendor: Yup.string()
      .max(200, 'Vendor name must be less than 200 characters'),
    payment_method: Yup.string()
      .max(50, 'Payment method must be less than 50 characters'),
    currency: Yup.string()
      .required('Currency is required'),
    exchange_rate: Yup.number()
      .min(0, 'Exchange rate must be positive')
      .when('currency', {
        is: (val) => val !== 'INR',
        then: (schema) => schema.required('Exchange rate is required for non-INR currencies'),
        otherwise: (schema) => schema.notRequired(),
      }),
    client_id: Yup.number()
      .nullable(),
    invoice_id: Yup.number()
      .nullable(),
  });

  const formik = useFormik({
    initialValues: {
      amount: '',
      category_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      vendor: '',
      payment_method: '',
      receipt_file: '',
      currency: 'INR',
      exchange_rate: 1,
      client_id: '',
      invoice_id: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const expenseData = {
          ...values,
          amount: parseFloat(values.amount),
          exchange_rate: values.currency === 'INR' ? null : parseFloat(values.exchange_rate || 0),
          client_id: values.client_id ? parseInt(values.client_id) : null,
          invoice_id: values.invoice_id ? parseInt(values.invoice_id) : null,
          category_id: parseInt(values.category_id),
        };

        let expense;
        if (id) {
          expense = await expenseService.updateExpense(id, expenseData);
          toast.success('Expense updated successfully');
        } else {
          expense = await expenseService.createExpense(expenseData);
          toast.success('Expense created successfully');
        }

        // Upload receipt if provided
        if (receiptFile) {
          await expenseService.uploadReceipt(expense.id, receiptFile);
        }

        navigate('/expenses', { state: { refresh: true } });
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to save expense');
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch categories, clients, and invoices on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setCategoriesLoading(true);
        setClientsLoading(true);
        
        const [categoriesData, clientsData] = await Promise.all([
          expenseCategoryService.getExpenseCategories(),
          clientService.getAll(),
        ]);
        
        setCategories(categoriesData || []);
        setClients(Array.isArray(clientsData) ? clientsData : (clientsData.data || []));
      } catch (error) {
        toast.error('Failed to fetch data');
      } finally {
        setCategoriesLoading(false);
        setClientsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch expense if editing
  useEffect(() => {
    if (id) {
      const fetchExpense = async () => {
        try {
          const expense = await expenseService.getExpense(id);
          
          // Get invoices for this client if client is selected
          if (expense.client_id) {
            const invoicesData = await invoiceService.getByClientId(expense.client_id);
            setInvoices(Array.isArray(invoicesData) ? invoicesData : (invoicesData.data || []));
          }
          
          formik.setValues({
            amount: expense.amount,
            category_id: expense.category_id,
            date: expense.date,
            description: expense.description,
            vendor: expense.vendor || '',
            payment_method: expense.payment_method || '',
            currency: expense.currency || 'INR',
            exchange_rate: expense.exchange_rate || 1,
            client_id: expense.client_id || '',
            invoice_id: expense.invoice_id || '',
          });
        } catch (error) {
          toast.error('Failed to fetch expense');
          navigate('/expenses');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchExpense();
    }
  }, [id]);

  // Fetch invoices when client changes
  useEffect(() => {
    if (formik.values.client_id) {
      const fetchInvoices = async () => {
        try {
          const invoicesData = await invoiceService.getByClientId(formik.values.client_id);
          setInvoices(Array.isArray(invoicesData) ? invoicesData : (invoicesData.data || []));
        } catch (error) {
          console.warn('Failed to fetch invoices:', error);
          setInvoices([]);
        }
      };
      fetchInvoices();
    } else {
      setInvoices([]);
      formik.setFieldValue('invoice_id', '');
    }
  }, [formik.values.client_id]);

  const handleReceiptUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid file (JPEG, PNG, GIF, or PDF)');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setReceiptFile(file);
      toast.success('Receipt file selected');
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

  const currencySymbol = getCurrencySymbol(formik.values.currency);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Expense' : 'Create New Expense'}
        </h1>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            Expense Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  name="amount"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`input-field pl-8 ${
                    formik.touched.amount && formik.errors.amount
                      ? 'border-red-500'
                      : ''
                  }`}
                />
              </div>
              {formik.touched.amount && formik.errors.amount && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.amount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formik.values.date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`input-field ${
                  formik.touched.date && formik.errors.date
                    ? 'border-red-500'
                    : ''
                }`}
              />
              {formik.touched.date && formik.errors.date && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.date}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={formik.values.category_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`input-field ${
                  formik.touched.category_id && formik.errors.category_id
                    ? 'border-red-500'
                    : ''
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {formik.touched.category_id && formik.errors.category_id && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.category_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                name="payment_method"
                value={formik.values.payment_method}
                onChange={formik.handleChange}
                className="input-field"
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
                <option value="Digital Wallet">Digital Wallet</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formik.values.currency}
                onChange={formik.handleChange}
                className="input-field"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
              </select>
            </div>

            {formik.values.currency !== 'INR' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exchange Rate (1 {formik.values.currency} to INR)
                </label>
                <input
                  type="number"
                  name="exchange_rate"
                  value={formik.values.exchange_rate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  min="0"
                  step="0.01"
                  className={`input-field ${
                    formik.touched.exchange_rate && formik.errors.exchange_rate
                      ? 'border-red-500'
                      : ''
                  }`}
                />
                {formik.touched.exchange_rate && formik.errors.exchange_rate && (
                  <p className="mt-1 text-sm text-red-600">
                    {formik.errors.exchange_rate}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor/Supplier
              </label>
              <input
                type="text"
                name="vendor"
                value={formik.values.vendor}
                onChange={formik.handleChange}
                placeholder="e.g., Amazon, Microsoft, Local Store"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client (Optional)
              </label>
              <select
                name="client_id"
                value={formik.values.client_id}
                onChange={formik.handleChange}
                className="input-field"
              >
                <option value="">No specific client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `- ${client.company}`}
                  </option>
                ))}
              </select>
            </div>

            {formik.values.client_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Invoice (Optional)
                </label>
                <select
                  name="invoice_id"
                  value={formik.values.invoice_id}
                  onChange={formik.handleChange}
                  className="input-field"
                >
                  <option value="">No specific invoice</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      Invoice #{invoice.invoice_number} - {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Description
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rows={4}
              placeholder="Describe the expense in detail..."
              className={`input-field ${
                formik.touched.description && formik.errors.description
                  ? 'border-red-500'
                  : ''
              }`}
            />
            {formik.touched.description && formik.errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {formik.errors.description}
              </p>
            )}
          </div>
        </div>

        {/* Receipt Upload */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PhotoIcon className="h-5 w-5 mr-2" />
            Receipt
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Receipt
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png,.gif,.pdf"
                      onChange={handleReceiptUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, or PDF up to 5MB
                </p>
                {receiptFile && (
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <span className="mr-2">{receiptFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setReceiptFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={loading || !formik.isValid}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Expense' : 'Create Expense'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
