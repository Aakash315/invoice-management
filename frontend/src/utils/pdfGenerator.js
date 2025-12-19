






import jsPDF from 'jspdf';
import { format } from 'date-fns';

export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF();
  
  try {
    // Company Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Webby Wonder', 150, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Mumbai, India', 150, 26);
    
    // Invoice Details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 40);
    doc.text(`Issue Date: ${format(new Date(invoice.issue_date), 'dd MMM yyyy')}`, 20, 46);
    doc.text(`Due Date: ${format(new Date(invoice.due_date), 'dd MMM yyyy')}`, 20, 52);
    
    // Status Badge
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(150, 35, 40, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(invoice.status.toUpperCase(), 155, 40);
    doc.setTextColor(0, 0, 0);
    
    // Bill To
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.client.name, 20, 76);
    if (invoice.client.company) {
      doc.text(invoice.client.company, 20, 82);
    }
    doc.text(invoice.client.email, 20, 88);
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, 20, 94);
    }
    
    // Items Section (manual table layout)
    let currentY = 110;
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, currentY);
    doc.text('Qty', 120, currentY);
    doc.text('Rate', 140, currentY);
    doc.text('Amount', 170, currentY);
    
    currentY += 10;
    doc.line(20, currentY - 5, 180, currentY - 5);
    
    // Items data
    doc.setFont('helvetica', 'normal');
    invoice.items.forEach(item => {
      doc.text(item.description, 20, currentY);
      doc.text(item.quantity.toString(), 120, currentY, { align: 'center' });
      doc.text(`${item.rate.toLocaleString()}`, 145, currentY, { align: 'right' });
      doc.text(`${item.amount.toLocaleString()}`, 180, currentY, { align: 'right' });
      currentY += 8;
    });
    
    currentY += 10;
    
    // Totals
    const rightAlign = 140;
    
    doc.text('Subtotal:', rightAlign, currentY);
    doc.text(`${invoice.subtotal.toLocaleString()}`, 180, currentY, { align: 'right' });
    
    currentY += 6;
    doc.text(`Tax (${invoice.tax_rate}%):`, rightAlign, currentY);
    doc.text(`${invoice.tax_amount.toLocaleString()}`, 180, currentY, { align: 'right' });
    
    if (invoice.discount > 0) {
      currentY += 6;
      doc.text('Discount:', rightAlign, currentY);
      doc.text(`-${invoice.discount.toLocaleString()}`, 180, currentY, { align: 'right' });
    }
    
    // Total
    currentY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', rightAlign, currentY);
    doc.text(`${invoice.total_amount.toLocaleString()}`, 180, currentY, { align: 'right' });
    
    // Payment Info
    if (invoice.paid_amount > 0) {
      currentY += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Paid:', rightAlign, currentY);
      doc.text(`${invoice.paid_amount.toLocaleString()}`, 180, currentY, { align: 'right' });
      
      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Balance Due:', rightAlign, currentY);
      doc.text(`${invoice.balance.toLocaleString()}`, 180, currentY, { align: 'right' });
    }
    
    // Notes and Terms
    if (invoice.notes || invoice.terms) {
      const notesY = currentY + 25;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      if (invoice.notes) {
        doc.text('Notes:', 20, notesY);
        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(invoice.notes, 170);
        doc.text(notesLines, 20, notesY + 6);
      }
      
      if (invoice.terms) {
        const termsY = invoice.notes ? notesY + 20 : notesY;
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions:', 20, termsY);
        doc.setFont('helvetica', 'normal');
        const termsLines = doc.splitTextToSize(invoice.terms, 170);
        doc.text(termsLines, 20, termsY + 6);
      }
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    // Save PDF
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};
