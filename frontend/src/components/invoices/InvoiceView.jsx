
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoiceService } from '../../services/invoiceService';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PaymentModal from './PaymentModal';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import EmailComposeModal from './EmailComposeModal';
import RecurringBadge from '../common/RecurringBadge';
import { useApi } from '../../hooks/useApi'; // Import useApi

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi(); // Initialize useApi
  const [invoice, setInvoice] = useState(null);
  const [emailHistory, setEmailHistory] = useState([]);
  const [reminderHistory, setReminderHistory] = useState([]); // New state for reminder history
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [resendTo, setResendTo] = useState('');
  const [isManualReminderDropdownOpen, setIsManualReminderDropdownOpen] = useState(false); // New state

  const handleSendManualReminder = async (reminderType) => {
    setIsManualReminderDropdownOpen(false); // Close dropdown
    try {
      await api.post(`/reminders/${id}/send-manual-reminder?reminder_type=${reminderType}`);
      toast.success(`Manual ${reminderType} reminder sent successfully!`);
      fetchReminderHistory(); // Refresh reminder history
    } catch (error) {
      const errorMessage = error.response?.data?.detail || `Failed to send manual ${reminderType} reminder.`;
      toast.error(errorMessage);
      console.error(`Error sending manual ${reminderType} reminder:`, error);
    }
  };


  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);

      const data = await invoiceService.getById(id);
      setInvoice(data);
    } catch (error) {
      toast.error('Failed to fetch invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchEmailHistory = useCallback(async () => {
    try {
      const data = await invoiceService.getEmailHistory(id);
      setEmailHistory(data);
    } catch (error) {
      toast.error('Failed to fetch email history');
    }
  }, [id]);

  const fetchReminderHistory = useCallback(async () => {
    try {
      const data = await api.get(`/reminders/${id}/history`);
      setReminderHistory(data);
    } catch (error) {
      toast.error('Failed to fetch reminder history');
      console.error('Error fetching reminder history:', error);
    }
  }, [id, api]);

  useEffect(() => {
    fetchInvoice();
    fetchEmailHistory();
    fetchReminderHistory(); // Fetch reminder history
  }, [id, fetchInvoice, fetchEmailHistory, fetchReminderHistory]);

  const handlePaymentAdded = () => {
    setPaymentModal(false);
    fetchInvoice(); // Refresh invoice data
  };

  const handleDownloadPDF = () => {
    try {
      console.log('Generating PDF for invoice:', invoice);
      generateInvoicePDF(invoice);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(`Failed to download PDF: ${error.message}`);
    }
  };

  const handleOpenEmailModal = (email = '') => {
    setResendTo(email);
    setIsEmailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!invoice) return null;

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

  const getTemplateStyles = () => {
    if (!invoice?.template_config) return {};
    const config = invoice.template_config;
    
    return {
      container: {
        fontFamily: config.font_family || 'sans-serif',
        fontSize: `${config.font_size_base || 14}px`,
        color: config.text_color || '#000',
        backgroundColor: config.background_color || '#fff',
      },
      header: {
        color: config.primary_color || '#000',
        fontSize: `${config.font_size_header || 24}px`,
      },
      invoiceTitle: {
        fontSize: `${config.font_size_title || 36}px`,
        color: config.primary_color || '#000',
      },
      tableHeader: {
        backgroundColor: config.accent_color || '#f0f0f0',
        color: config.secondary_color || '#000',
      },
      totalAmount: {
        color: config.primary_color || '#000',
      },
      companyName: {
        color: config.primary_color || '#000',
        fontSize: '1.25rem', // text-xl
        fontWeight: 'bold',
      },
    };
  };

  const templateStyles = getTemplateStyles();

  return (
    <div className="max-w-5xl mx-auto space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/invoices')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoice.invoice_number}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Created on {format(new Date(invoice.created_at), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {invoice.generated_by_template && invoice.template && (
            <Link
              to={`/recurring-invoices/view/${invoice.template.id}`}
              className="btn-secondary flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              View Template
            </Link>
          )}
          <button
            onClick={() => handleOpenEmailModal()}
            className="btn-secondary flex items-center"
          >
            <EnvelopeIcon className="h-5 w-5 mr-2" />
            Send via Email
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn-secondary flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Download PDF
          </button>
          <Link
            to={`/invoices/edit/${id}`}
            className="btn-primary flex items-center"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="card p-8" style={templateStyles.container}>
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {invoice.template_config.show_invoice_number && (
              <>
                <h2 className="text-3xl font-bold mb-2" style={templateStyles.invoiceTitle}>INVOICE</h2>
                <p className="text-gray-600">{invoice.invoice_number}</p>
              </>
            )}
          </div>
          <div className="text-right">
            {invoice.template_config.show_company_logo && invoice.template_config.company_logo_url && (
                <img src={invoice.template_config.company_logo_url} alt="Company Logo" className="h-16 w-auto object-contain mb-2" />
            )}
            {invoice.template_config.show_company_details && (
              <>
                <h3 style={templateStyles.companyName}>{invoice.template_config.company_name}</h3>
                <p className="text-gray-600 text-sm">{invoice.template_config.company_address}</p>
              </>
            )}
          </div>
        </div>

        {/* Client and Date Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            {invoice.template_config.show_client_details && (
              <>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Bill To
                </h4>
                <div className="text-gray-900">
                  <p className="font-semibold">{invoice.client?.name}</p>
                  {invoice.client?.company && (
                    <p className="text-sm">{invoice.client.company}</p>
                  )}
                  <p className="text-sm">{invoice.client?.email}</p>
                  {invoice.client?.phone && (
                    <p className="text-sm">{invoice.client.phone}</p>
                  )}
                  {invoice.client?.address && (
                    <div className="text-sm mt-2">
                      <p>{invoice.client.address}</p>
                      <p>
                        {invoice.client.city}, {invoice.client.state}{' '}
                        {invoice.client.pincode}
                      </p>
                    </div>
                  )}
                  {invoice.client?.gstin && (
                    <p className="text-sm mt-2">GSTIN: {invoice.client.gstin}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="text-right">
            <div className="mb-4">
              <span
                className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {invoice.template_config.show_issue_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue Date:</span>
                  <span className="font-medium">
                    {format(new Date(invoice.issue_date), 'dd MMM yyyy')}
                  </span>
                </div>
              )}
              {invoice.template_config.show_due_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium">
                    {format(new Date(invoice.due_date), 'dd MMM yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        {invoice.template_config.show_line_items && (
          <div className="mb-8 overflow-x-auto">
            <table className="w-full">
              <thead style={templateStyles.tableHeader}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase">
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
        )}

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-xs space-y-2">
            {invoice.template_config.show_subtotal && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {currencySymbol}{invoice.subtotal.toLocaleString()}
                </span>
              </div>
            )}
            {invoice.template_config.show_tax && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({invoice.tax_rate}%):</span>
                <span className="font-medium">
                  {currencySymbol}{invoice.tax_amount.toLocaleString()}
                </span>
              </div>
            )}
            {invoice.template_config.show_discount && invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">
                  -{currencySymbol}{invoice.discount.toLocaleString()}
                </span>
              </div>
            )}
            {invoice.template_config.show_total && (
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-xl" style={templateStyles.totalAmount}>
                  {currencySymbol}{invoice.total_amount.toLocaleString()}
                </span>
              </div>
            )}
            {invoice.template_config.show_paid_amount && invoice.paid_amount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium text-green-600">
                    {currencySymbol}{invoice.paid_amount.toLocaleString()}
                  </span>
                </div>
                {invoice.template_config.show_balance_due && (
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">Balance Due:</span>
                    <span className="text-red-600">
                      {currencySymbol}{invoice.balance.toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="border-t pt-6 space-y-4">
          {invoice.template_config.show_notes && invoice.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Notes
              </h4>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
          {invoice.template_config.show_terms && invoice.terms && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Terms & Conditions
              </h4>
              <p className="text-sm text-gray-600">{invoice.terms}</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Information - Only show for recurring invoices */}
      {invoice.generated_by_template && invoice.template && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ArrowPathIcon className="h-5 w-5 mr-2 text-blue-600" />
              Template Information
            </h3>
            <Link
              to={`/recurring-invoices/view/${invoice.template.id}`}
              className="btn-secondary flex items-center text-sm"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View Template
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template Name</label>
                  <p className="mt-1 text-sm text-gray-900">{invoice.template.template_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recurrence Pattern</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {invoice.template.interval_value === 1 
                      ? invoice.template.frequency.charAt(0).toUpperCase() + invoice.template.frequency.slice(1)
                      : `Every ${invoice.template.interval_value} ${invoice.template.frequency}${invoice.template.interval_value > 1 ? 's' : ''}`
                    }
                    {invoice.template.frequency === 'weekly' && invoice.template.day_of_week !== null && (
                      <span>
                        {' '}on {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][invoice.template.day_of_week]}
                      </span>
                    )}
                    {invoice.template.frequency === 'monthly' && invoice.template.day_of_month !== null && (
                      <span>
                        {' '}on day {invoice.template.day_of_month}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Template Status</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    invoice.template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.template.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generated On</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(invoice.created_at), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next Due Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(invoice.template.next_due_date), 'dd MMM yyyy')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Generated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {invoice.template.generation_count} invoices
                    {invoice.template.failed_generations > 0 && (
                      <span className="text-red-600 ml-2">
                        ({invoice.template.failed_generations} failed)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {invoice.template.auto_send && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  <strong>Auto-send enabled:</strong> This template automatically sends generated invoices via email
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Section */}
      {invoice.payment_status !== 'paid' && (
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Status
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Balance Due: {currencySymbol}{invoice.balance.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setPaymentModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Record Payment
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
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
                      ₹{payment.amount.toLocaleString()}
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

      {/* Email History */}
      {emailHistory && emailHistory.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Email History
          </h3>
          <div className="space-y-4">
            {emailHistory.map((history) => (
              <div key={history.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${history.status === 'sent' || history.status === 'delivered' || history.status === 'opened' ? 'bg-green-400' : history.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Sent to {history.sent_to || history.recipient} on {history.formatted_sent_time || format(new Date(history.sent_at), 'dd MMM yyyy, hh:mm a')}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            {history.delivery_summary || `Status: ${history.status_display || history.status}`}
                          </span>
                          {history.subject && (
                            <span className="text-xs text-gray-400 truncate max-w-xs">
                              Subject: {history.subject}
                            </span>
                          )}
                        </div>
                        {history.error_message && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {history.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        history.status_color || (history.status === 'sent' 
                          ? 'bg-green-100 text-green-800' 
                          : history.status === 'failed' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800')
                      }`}
                      title={history.delivery_summary}
                    >
                      {history.status_display || history.status}
                    </span>
                    <button
                      onClick={() => handleOpenEmailModal(history.sent_to || history.recipient)}
                      className="text-xs text-primary-600 hover:text-primary-900 font-medium"
                      title="Resend this email"
                    >
                      Resend
                    </button>
                  </div>
                </div>
                {history.attachment_filename && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                    </svg>
                    {history.attachment_filename}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminder History */}
      {reminderHistory && reminderHistory.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reminder History
          </h3>
          <div className="space-y-4">
            {reminderHistory.map((history) => (
              <div key={history.id} className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {history.reminder_type} sent to {history.recipient_email} on {format(new Date(history.sent_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Subject: {history.email_subject}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Reminder Button */}
      {invoice.payment_status !== 'paid' && (
        <div className="card p-5 overflow-visible">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Send Manual Reminder
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Trigger a reminder email manually.
              </p>
            </div>
            {/* Dropdown for reminder types */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                className="btn-primary flex items-center"
                onClick={() => setIsManualReminderDropdownOpen(!isManualReminderDropdownOpen)}
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Send Reminder
              </button>
              {isManualReminderDropdownOpen && (
                <div className="origin-bottom-right absolute right-0 bottom-full mb-2 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      onClick={() => handleSendManualReminder('friendly')}
                    >
                      Friendly Reminder (Due Soon)
                    </button>
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      onClick={() => handleSendManualReminder('due')}
                    >
                      Due Date Reminder
                    </button>
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      onClick={() => handleSendManualReminder('first_overdue')}
                    >
                      First Overdue Reminder (1-7 days)
                    </button>
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      onClick={() => handleSendManualReminder('second_overdue')}
                    >
                      Second Overdue Reminder (7-15 days)
                    </button>
                    <button
                      className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      onClick={() => handleSendManualReminder('final_notice')}
                    >
                      Final Notice (15+ days)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        invoice={invoice}
        onPaymentAdded={handlePaymentAdded}
      />

      {/* Email Modal */}
      <EmailComposeModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        invoice={invoice}
        resendTo={resendTo}
      />
    </div>
  );
};

export default InvoiceView;