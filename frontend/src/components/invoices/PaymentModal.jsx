import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { invoiceService } from '../../services/invoiceService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, invoice, onPaymentAdded }) => {
  if (!isOpen || !invoice) return null;

  const validationSchema = Yup.object({
    amount: Yup.number()
      .required('Amount is required')
      .min(0.01, 'Amount must be greater than 0')
      .max(invoice.balance, `Amount cannot exceed balance of ₹${invoice.balance}`),
    payment_date: Yup.date().required('Payment date is required'),
    payment_method: Yup.string(),
    reference_number: Yup.string(),
    notes: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      amount: invoice.balance,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'bank_transfer',
      reference_number: '',
      notes: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await invoiceService.addPayment(invoice.id, values);
        toast.success('Payment recorded successfully');
        onPaymentAdded();
        onClose();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to record payment');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Record Payment
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="amount"
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    step="0.01"
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
                <p className="mt-1 text-sm text-gray-500">
                  Balance Due: ₹{invoice.balance.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={formik.values.payment_date}
                  onChange={formik.handleChange}
                  className="input-field"
                />
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
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="reference_number"
                  value={formik.values.reference_number}
                  onChange={formik.handleChange}
                  placeholder="Transaction ID or Cheque Number"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  placeholder="Optional notes"
                  className="input-field"
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={formik.isSubmitting || !formik.isValid}
                  className="btn-primary disabled:opacity-50"
                >
                  {formik.isSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;