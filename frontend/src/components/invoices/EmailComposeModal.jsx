
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { invoiceService } from '../../services/invoiceService';

const EmailComposeModal = ({ isOpen, onClose, invoice, resendTo = '' }) => {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pdfAttachment, setPdfAttachment] = useState(null);

  useEffect(() => {
    if (invoice) {
      // If resendTo is provided, use it; otherwise use client's email
      setTo(resendTo || invoice.client?.email || '');
      setSubject(`Invoice #${invoice.invoice_number} from Webby Wonder`);
      setMessage(
        `Dear ${invoice.client?.name || 'Client'},

        Please find attached your invoice #${invoice.invoice_number} for the amount of ₹${invoice.total_amount.toLocaleString()}.

        Thank you for your business!

        Best regards,
        Webby Wonder
        Mumbai, Maharashtra`
      );

      // Generate PDF when modal opens
      const generatePdf = async () => {
        try {
          const pdfBlob = await generateInvoicePDF(invoice, 'blob');
          setPdfAttachment(new File([pdfBlob], `${invoice.invoice_number}.pdf`, { type: 'application/pdf' }));
        } catch (error) {
          console.error('Error generating PDF for email:', error);
          toast.error('Could not generate PDF attachment.');
        }
      };
      generatePdf();
    }
  }, [invoice, isOpen, resendTo]);

  const handleSend = async () => {
    if (!to) {
      toast.error('Recipient email is required.');
      return;
    }
    
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('to', to);
      formData.append('cc', cc);
      formData.append('bcc', bcc);
      formData.append('subject', subject);
      formData.append('message', message);
      if (pdfAttachment) {
        formData.append('attachment', pdfAttachment);
      }

      await invoiceService.sendInvoiceEmail(invoice.id, formData);
      
      toast.success('Email sent successfully!');
      onClose();
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error('Failed to send email.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Send Invoice via Email</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div className="space-y-4">
          <input type="email" placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} className="input w-full" />
          <input type="email" placeholder="CC" value={cc} onChange={(e) => setCc(e.target.value)} className="input w-full" />
          <input type="email" placeholder="BCC" value={bcc} onChange={(e) => setBcc(e.target.value)} className="input w-full" />
          <input type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="input w-full" />
          <textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} className="textarea w-full h-48"></textarea>
          
          {pdfAttachment && (
            <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-md">
              <PaperClipIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">{pdfAttachment.name}</span>
              <span className="text-sm text-gray-500">
({(pdfAttachment.size / 1024).toFixed(1)} KB)
</span>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSend} className="btn-primary" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailComposeModal;
