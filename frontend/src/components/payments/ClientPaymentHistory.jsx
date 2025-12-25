import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useClientAuth } from '../../hooks/useClientAuth';

const ClientPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, loading: authLoading, client } = useClientAuth();

  const fetchClientPayments = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await clientPortalService.getClientPayments();
      setPayments(data || []);
    } catch (err) {
      console.error("Failed to fetch client payments:", err);
      setError("Failed to load your payment history. Please try again.");
      toast.error('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchClientPayments();
    }
  }, [isAuthenticated, authLoading]);

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
      <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/portal/invoices/${payment.invoice_id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      {/* Assuming invoice object is nested or can be fetched */}
                      #{payment.invoice_id} {/* Placeholder - ideally invoice_number */}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {/* Assuming invoice currency is available with payment or from client */}
                    {getCurrencySymbol(client?.base_currency || 'USD')}{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.payment_method || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.reference_number || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No payment history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPaymentHistory;