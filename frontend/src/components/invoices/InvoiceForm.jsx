import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { invoiceService } from '../../services/invoiceService';
import { clientService } from '../../services/clientService';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  const validationSchema = Yup.object({
    client_id: Yup.number().required('Client is required'),
    issue_date: Yup.date().required('Issue date is required'),
    due_date: Yup.date()
      .required('Due date is required')
      .min(Yup.ref('issue_date'), 'Due date must be after issue date'),
    items: Yup.array()
      .of(
        Yup.object({
          description: Yup.string().required('Description is required'),
          quantity: Yup.number()
            .required('Quantity is required')
            .min(1, 'Minimum 1'),
          rate: Yup.number()
            .required('Rate is required')
            .min(0, 'Rate must be positive'),
        })
      )
      .min(1, 'At least one item is required'),
    tax_rate: Yup.number().min(0).max(100),
    discount: Yup.number().min(0),
    notes: Yup.string(),
    terms: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      client_id: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      items: [{ description: '', quantity: 1, rate: 0 }],
      tax_rate: 18,
      discount: 0,
      status: 'draft',
      notes: '',
      terms: 'Payment due within 30 days',
    },
    validationSchema,

    onSubmit: async (values) => {
      setLoading(true);
      try {

        if (id) {
          await invoiceService.update(id, values);
          toast.success('Invoice updated successfully');
          // Set flag to refresh invoice list
          sessionStorage.setItem('invoiceUpdated', 'true');
        } else {
          await invoiceService.create(values);
          toast.success('Invoice created successfully');
        }
        navigate('/invoices', { state: { refresh: true } });
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to save invoice');
      } finally {
        setLoading(false);
      }
    },
  });





  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const data = await clientService.getAll();
        // API returns array directly, not wrapped in object
        const clientsList = Array.isArray(data) ? data : (data.data || []);
        setClients(clientsList);
      } catch (error) {
        toast.error('Failed to fetch clients');
        setClients([]); // Set empty array on error
      } finally {
        setClientsLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Fetch invoice if editing
  useEffect(() => {
    if (id) {
      const fetchInvoice = async () => {

        try {
          const invoice = await invoiceService.getById(id);
          formik.setValues({
            client_id: invoice.client_id,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            items: invoice.items || [],
            tax_rate: invoice.tax_rate,
            discount: invoice.discount,
            status: invoice.status,
            notes: invoice.notes || '',
            terms: invoice.terms || '',
          });
        } catch (error) {
          toast.error('Failed to fetch invoice');
          navigate('/invoices');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchInvoice();
    }
  }, [id]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formik.values.items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
      0
    );
    const taxAmount = (subtotal * (formik.values.tax_rate || 0)) / 100;
    const total = subtotal + taxAmount - (formik.values.discount || 0);

    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const totals = calculateTotals();

  // Line item handlers
  const addItem = () => {
    formik.setFieldValue('items', [
      ...formik.values.items,
      { description: '', quantity: 1, rate: 0 },
    ]);
  };

  const removeItem = (index) => {
    const newItems = formik.values.items.filter((_, i) => i !== index);
    formik.setFieldValue('items', newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formik.values.items];
    newItems[index][field] = value;
    formik.setFieldValue('items', newItems);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Invoice' : 'Create New Invoice'}
        </h1>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                name="client_id"
                value={formik.values.client_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`input-field ${
                  formik.touched.client_id && formik.errors.client_id
                    ? 'border-red-500'
                    : ''
                }`}
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `- ${client.company}`}
                  </option>
                ))}
              </select>
              {formik.touched.client_id && formik.errors.client_id && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.client_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="issue_date"
                value={formik.values.issue_date}
                onChange={formik.handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="due_date"
                value={formik.values.due_date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`input-field ${
                  formik.touched.due_date && formik.errors.due_date
                    ? 'border-red-500'
                    : ''
                }`}
              />
              {formik.touched.due_date && formik.errors.due_date && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.due_date}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              className="input-field max-w-xs"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary text-sm flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formik.values.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 items-start pb-4 border-b last:border-b-0"
              >
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, 'description', e.target.value)
                    }
                    placeholder="Service or product description"
                    className="input-field"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    min="1"
                    className="input-field"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) =>
                      updateItem(index, 'rate', parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="input-field bg-gray-50">
                    ₹{((item.quantity || 0) * (item.rate || 0)).toFixed(2)}
                  </div>
                </div>

                <div className="col-span-1 flex items-end">
                  {formik.values.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {formik.errors.items && typeof formik.errors.items === 'string' && (
            <p className="mt-2 text-sm text-red-600">{formik.errors.items}</p>
          )}
        </div>

        {/* Calculations */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculations</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="tax_rate"
                  value={formik.values.tax_rate}
                  onChange={formik.handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="input-field max-w-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formik.values.discount}
                  onChange={formik.handleChange}
                  min="0"
                  step="0.01"
                  className="input-field max-w-xs"
                />
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Tax ({formik.values.tax_rate}%):
                </span>
                <span className="font-medium">₹{totals.taxAmount}</span>
              </div>
              {formik.values.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">
                    -₹{formik.values.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-lg">Total:</span>
                <span className="font-bold text-lg text-primary-600">
                  ₹{totals.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formik.values.notes}
                onChange={formik.handleChange}
                placeholder="Additional notes for the client"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                name="terms"
                rows={3}
                value={formik.values.terms}
                onChange={formik.handleChange}
                placeholder="Payment terms, late fees, etc."
                className="input-field"
              />
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
            {loading ? 'Saving...' : id ? 'Update Invoice' : 'Create Invoice'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;