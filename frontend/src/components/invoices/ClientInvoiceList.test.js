import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ClientInvoiceList from './ClientInvoiceList';
import { clientPortalService } from '../../services/clientPortalService';
import { ClientAuthContext } from '../../context/ClientAuthContext';
import toast from 'react-hot-toast';

// Mock clientPortalService
jest.mock('../../services/clientPortalService', () => ({
  clientPortalService: {
    getClientInvoices: jest.fn(),
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const mockClient = { name: 'Test Client', base_currency: 'USD' };

const renderClientInvoiceList = (isAuthenticated = true, authLoading = false, client = mockClient) => {
  return render(
    <ClientAuthContext.Provider value={{ isAuthenticated, loading: authLoading, client }}>
      <BrowserRouter>
        <ClientInvoiceList />
      </BrowserRouter>
    </ClientAuthContext.Provider>
  );
};

describe('ClientInvoiceList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    clientPortalService.getClientInvoices.mockReturnValue(new Promise(() => {})); // Never resolve
    renderClientInvoiceList();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays "No invoices found" when no invoices are returned', async () => {
    clientPortalService.getClientInvoices.mockResolvedValueOnce([]);
    renderClientInvoiceList();
    await waitFor(() => {
      expect(screen.getByText('No invoices found')).toBeInTheDocument();
    });
    expect(clientPortalService.getClientInvoices).toHaveBeenCalledTimes(1);
  });

  test('displays a list of invoices', async () => {
    const mockInvoices = [
      {
        id: 1,
        invoice_number: 'INV-001',
        issue_date: '2023-01-01',
        due_date: '2023-01-31',
        total_amount: 100.00,
        balance: 0.00,
        currency: 'USD',
        status: 'paid',
        payment_status: 'paid',
      },
      {
        id: 2,
        invoice_number: 'INV-002',
        issue_date: '2023-02-01',
        due_date: '2023-02-28',
        total_amount: 250.00,
        balance: 50.00,
        currency: 'USD',
        status: 'sent',
        payment_status: 'partial',
      },
    ];
    clientPortalService.getClientInvoices.mockResolvedValueOnce(mockInvoices);
    renderClientInvoiceList();

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('INV-002')).toBeInTheDocument();
      expect(screen.getByText('paid')).toBeInTheDocument(); // Invoice 1 status
      expect(screen.getByText('partial')).toBeInTheDocument(); // Invoice 2 payment status
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('Balance: $50.00')).toBeInTheDocument();
    });
  });

  test('shows error message on fetch failure', async () => {
    clientPortalService.getClientInvoices.mockRejectedValueOnce(new Error('API Error'));
    renderClientInvoiceList();
    await waitFor(() => {
      expect(screen.getByText('Failed to load your invoices. Please try again.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch invoices');
    });
  });

  test('redirects unauthenticated user', async () => {
    renderClientInvoiceList(false); // Unauthenticated
    await waitFor(() => {
        expect(clientPortalService.getClientInvoices).not.toHaveBeenCalled();
    });
  });
});
