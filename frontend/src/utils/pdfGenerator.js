import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF();
  
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
  
  // Items Table
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `₹${item.rate.toLocaleString()}`,
    `₹${item.amount.toLocaleString()}`
  ]);
  
  doc.autoTable({
    startY: 110,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });
  
  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  const rightAlign = 140;
  
  doc.text('Subtotal:', rightAlign, finalY);
  doc.text(`₹${invoice.subtotal.toLocaleString()}`, 180, finalY, { align: 'right' });
  
  doc.text(`Tax (${invoice.tax_rate}%):`, rightAlign, finalY + 6);
  doc.text(`₹${invoice.tax_amount.toLocaleString()}`, 180, finalY + 6, { align: 'right' });
  
  if (invoice.discount > 0) {
    doc.text('Discount:', rightAlign, finalY + 12);
    doc.text(`-₹${invoice.discount.toLocaleString()}`, 180, finalY + 12, { align: 'right' });
  }
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const totalY = invoice.discount > 0 ? finalY + 18 : finalY + 12;
  doc.text('TOTAL:', rightAlign, totalY);
  doc.text(`₹${invoice.total_amount.toLocaleString()}`, 180, totalY, { align: 'right' });
  
  // Payment Info
  if (invoice.paid_amount > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Paid:', rightAlign, totalY + 6);
    doc.text(`₹${invoice.paid_amount.toLocaleString()}`, 180, totalY + 6, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', rightAlign, totalY + 12);
    doc.text(`₹${invoice.balance.toLocaleString()}`, 180, totalY + 12, { align: 'right' });
  }
  
  // Notes and Terms
  if (invoice.notes || invoice.terms) {
    const notesY = totalY + 25;
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
};