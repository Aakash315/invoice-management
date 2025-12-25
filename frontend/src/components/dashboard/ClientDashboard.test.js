import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientDashboard from './ClientDashboard';
import { useClientDashboard } from '../../hooks/useClientDashboard';
import { useClientAuth } from '../../hooks/useClientAuth';
import RecentInvoices from './RecentInvoices'; // Import the actual component

// Mock the hooks
jest.mock('../../hooks/useClientDashboard');
jest.mock('../../hooks/useClientAuth');

// Mock RecentInvoices component to simplify testing the dashboard itself
jest.mock('./RecentInvoices', () => ({
  __esModule: true,
  default: ({ invoices }) => (
    <div>
      <h3>Recent Invoices</h3>
      {invoices.length > 0 ? (
        <ul>
          {invoices.map((inv) => (
            <li key={inv.id}>Invoice {inv.id}</li>
          ))}
        </ul>
      ) : (
        <p>No recent invoices</p>
      )}
    </div>
  ),
}));


describe('ClientDashboard', () => {
  const mockClient = { name: 'Test Client', base_currency: 'USD' };
  const mockInvoices = [
    { id: 1, total_amount: 100, paid_amount: 50, invoice_number: "INV-001" },
    { id: 2, total_amount: 200, paid_amount: 200, invoice_number: "INV-002" },
  ];
  const mockOutstandingAmount = 50;

  beforeEach(() => {
    jest.clearAllMocks();
    useClientAuth.mockReturnValue({
      client: mockClient,
      isAuthenticated: true,
      loading: false,
    });
    useClientDashboard.mockReturnValue({
      invoices: mockInvoices,
      payments: [], // Payments not directly displayed in dashboard
      outstandingAmount: mockOutstandingAmount,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  test('renders client dashboard with welcome message', () => {
    render(<ClientDashboard />);
    expect(screen.getByText(`Welcome, ${mockClient.name}!`)).toBeInTheDocument();
    expect(screen.getByText('Your Dashboard')).toBeInTheDocument();
  });

  test('displays outstanding amount', () => {
    render(<ClientDashboard />);
    expect(screen.getByText('Outstanding Amount')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument(); // Assuming default currency is USD from mock client
  });

  test('displays total invoices', () => {
    render(<ClientDashboard />);
    expect(screen.getByText('Total Invoices')).toBeInTheDocument();
    expect(screen.getByText(mockInvoices.length.toString())).toBeInTheDocument();
  });

  test('shows loading state', () => {
    useClientDashboard.mockReturnValue({
      invoices: [],
      payments: [],
      outstandingAmount: 0,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });
    render(<ClientDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // Assuming spinner is a progressbar role
  });

  test('shows error message', () => {
    useClientDashboard.mockReturnValue({
      invoices: [],
      payments: [],
      outstandingAmount: 0,
      loading: false,
      error: 'Failed to load data',
      refetch: jest.fn(),
    });
    render(<ClientDashboard />);
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  test('displays recent invoices by mocking the component', () => {
    render(<ClientDashboard />);
    expect(screen.getByText('Recent Invoices')).toBeInTheDocument();
    expect(screen.getByText('Invoice 1')).toBeInTheDocument();
    expect(screen.getByText('Invoice 2')).toBeInTheDocument();
  });
});
