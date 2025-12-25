import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { EyeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useClientAuth } from '../../hooks/useClientAuth';


const ClientInvoiceList = () => {

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, loading: authLoading } = useClientAuth();
  const navigate = useNavigate();

  const fetchClientInvoices = async () => {
    if (!isAuthenticated) {
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      const data = await clientPortalService.getClientInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error("Failed to fetch client invoices:", err);
      setError("Failed to load your invoices. Please try again.");
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
        fetchClientInvoices();
    }
  }, [isAuthenticated, authLoading]);


  const getStatusInfo = (status) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', icon: '📝' }; // Memo for draft
      case 'sent':
        return { color: 'bg-blue-100 text-blue-800', icon: '✉️' }; // Envelope for sent
      case 'paid':
        return { color: 'bg-green-100 text-green-800', icon: '✅' }; // Checkmark for paid
      case 'overdue':
        return { color: 'bg-red-100 text-red-800', icon: '⚠️' }; // Warning for overdue
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800', icon: '❌' }; // Cross for cancelled
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: '' };
    }
  };

  const getPaymentStatusInfo = (status) => {
    switch (status) {
      case 'unpaid':
        return { color: 'text-red-600', icon: '🕐' }; // Clock for unpaid
      case 'partial':
        return { color: 'text-yellow-600', icon: ' moitié' }; // Half-filled circle for partial
      case 'paid':
        return { color: 'text-green-600', icon: '💰' }; // Money bag for paid
      default:
        return { color: '', icon: '' };
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Your Invoices</h1>
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
                        to={`/portal/invoices/${invoice.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </div>
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
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusInfo(invoice.status).color}`}
                    >
                      {getStatusInfo(invoice.status).icon} {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${getPaymentStatusInfo(invoice.payment_status).color}`}
                    >
                      {getPaymentStatusInfo(invoice.payment_status).icon} {invoice.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/portal/invoices/${invoice.id}`)}
                        className="text-primary-600 hover:text-primary-700"
                        title="View"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      {/* Download PDF button will be added in ClientInvoiceView */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No invoices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientInvoiceList;