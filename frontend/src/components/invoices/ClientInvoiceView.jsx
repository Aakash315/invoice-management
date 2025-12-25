import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { useClientAuth } from '../../hooks/useClientAuth';
import { load } from "@cashfreepayments/cashfree-js";

const ClientInvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, loading: authLoading, client } = useClientAuth();

  const fetchClientInvoice = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await clientPortalService.getClientInvoiceById(id);
      setInvoice(data);
    } catch (err) {
      console.error("Failed to fetch client invoice:", err);
      setError("Failed to load invoice details. Please try again.");
      toast.error('Failed to fetch invoice');
      navigate('/portal/invoices');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchClientInvoice();
    }
  }, [authLoading, fetchClientInvoice]);

  const handleDownloadPDF = () => {
    try {
      if (invoice) {
        generateInvoicePDF(invoice);
        toast.success('PDF downloaded successfully!');
      } else {
        toast.error('No invoice data to download.');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error(`Failed to download PDF: ${err.message}`);
    }
  };

  const handleCashfreePayment = async () => {
    if (!invoice || !client) {
      toast.error('Invoice or client data missing for payment.');
      return;
    }

    try {
      const order = await clientPortalService.createCashfreeOrder(invoice.id, invoice.balance);

      const cashfree = await load({
        mode: "sandbox" //or production
      });

      let checkoutOptions = {
        paymentSessionId: order.payment_session_id,
        redirectTarget: "_self",
      };
      cashfree.checkout(checkoutOptions);
      // window.location.href = order.redirect_url;
    } catch (err) {
      console.error("Cashfree payment initiation failed:", err);
      toast.error(err.response?.data?.detail || 'Failed to initiate payment.');
    }
  };

  const handlePayPalPayment = async () => {
    if (!invoice || !client) {
      toast.error('Invoice or client data missing for PayPal payment.');
      return;
    }

    try {
      const order = await clientPortalService.createPayPalOrder(invoice.id, invoice.balance);
      window.location.href = order.approve_url;
    } catch (err) {
      console.error("PayPal order creation failed:", err);
      toast.error(err.response?.data?.detail || 'Failed to initiate PayPal payment.');
    }
  };

  // Effect to capture payments or show messages on return
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const cashfreeOrderId = query.get('cashfree_order_id');
    const paypalOrderId = query.get('token');

    if (cashfreeOrderId && !loading) {
      toast.success('Returned from Cashfree. Verifying payment status...');
      navigate(`/portal/invoices/${id}`, { replace: true });
      fetchClientInvoice();
    }

    if (paypalOrderId && !loading) {
      const capturePayment = async () => {
        try {
          await clientPortalService.capturePayPalPayment(paypalOrderId, id);
          toast.success('PayPal payment completed successfully!');
          navigate(`/portal/invoices/${id}`, { replace: true });
          fetchClientInvoice();
        } catch (err) {
          console.error("PayPal payment capture failed:", err);
          toast.error(err.response?.data?.detail || 'Failed to capture PayPal payment.');
          navigate(`/portal/invoices/${id}`, { replace: true });
        }
      };
      capturePayment();
    }
  }, [id, loading, navigate, fetchClientInvoice]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
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

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Invoice not found or you do not have permission to view it.</p>
      </div>
    );
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', icon: '📝' };
      case 'sent':
        return { color: 'bg-blue-100 text-blue-800', icon: '✉️' };
      case 'paid':
        return { color: 'bg-green-100 text-green-800', icon: '✅' };
      case 'overdue':
        return { color: 'bg-red-100 text-red-800', icon: '⚠️' };
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800', icon: '❌' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: '' };
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

  const currencySymbol = getCurrencySymbol(invoice.currency);

  return (
    <div className="max-w-5xl mx-auto space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/portal/invoices')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoice.invoice_number}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Issued on {format(new Date(invoice.issue_date), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {invoice.payment_status !== 'paid' && invoice.balance > 0 && (
            <>
              <button
                onClick={handleCashfreePayment}
                className="btn-primary flex items-center mr-2"
              >
                <span className="h-5 w-5 mr-2">💳</span>
                Pay with Cashfree
              </button>
              <button
                onClick={handlePayPalPayment}
                className="btn-secondary flex items-center"
              >
                <span className="h-5 w-5 mr-2">🅿️</span>
                Pay with PayPal
              </button>
            </>
          )}
          <button
            onClick={handleDownloadPDF}
            className="btn-secondary flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="card p-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
            <p className="text-gray-600">{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold text-gray-900">Webby Wonder</h3>
            <p className="text-gray-600 text-sm">Mumbai, India</p>
          </div>
        </div>

        {/* Client and Date Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Bill To
            </h4>
            <div className="text-gray-900">
              <p className="font-semibold">{client?.name}</p>
              {client?.company && (
                <p className="text-sm">{client.company}</p>
              )}
              <p className="text-sm">{client?.email}</p>
              {client?.phone && (
                <p className="text-sm">{client.phone}</p>
              )}
              {client?.address && (
                <div className="text-sm mt-2">
                  <p>{client.address}</p>
                  <p>
                    {client.city}, {client.state}{' '}
                    {client.pincode}
                  </p>
                </div>
              )}
              {client?.gstin && (
                <p className="text-sm mt-2">GSTIN: {client.gstin}</p>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="mb-4">
              <span
                className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusInfo(invoice.status).color}`}
              >
                {getStatusInfo(invoice.status).icon} {invoice.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span className="font-medium">
                  {format(new Date(invoice.issue_date), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">
                  {format(new Date(invoice.due_date), 'dd MMM yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-right">
                    {currencySymbol}{item.rate.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                    {currencySymbol}{item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                {currencySymbol}{invoice.subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({invoice.tax_rate}%):</span>
              <span className="font-medium">
                {currencySymbol}{invoice.tax_amount.toLocaleString()}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">
                  -{currencySymbol}{invoice.discount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-xl text-primary-600">
                {currencySymbol}{invoice.total_amount.toLocaleString()}
              </span>
            </div>
            {invoice.paid_amount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium text-green-600">
                    {currencySymbol}{invoice.paid_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900">Balance Due:</span>
                  <span className="text-red-600">
                    {currencySymbol}{invoice.balance.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="border-t pt-6 space-y-4">
            {invoice.notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Notes
                </h4>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Terms & Conditions
                </h4>
                <p className="text-sm text-gray-600">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment History (if any) */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment History
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {currencySymbol}{payment.amount.toLocaleString()}
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
          </div>
        </div>
      )}
    </div>
  );
};


export default ClientInvoiceView;