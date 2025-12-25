import React from 'react';
import { useClientDashboard } from '../../hooks/useClientDashboard';
import { useClientAuth } from '../../hooks/useClientAuth';
import StatsCard from './StatsCard'; // Reusing StatsCard from internal dashboard
import RecentInvoices from './RecentInvoices'; // Reusing RecentInvoices, but will be filtered by client

const ClientDashboard = () => {
  const { client } = useClientAuth();
  const { invoices, outstandingAmount, loading, error } = useClientDashboard();

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
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {client?.name || 'Client'}!</h1>
      <p className="text-lg text-gray-700">Your Dashboard</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Outstanding Amount"
          value={`${outstandingAmount.toLocaleString()}`}
          currency={client?.base_currency || 'INR'} // Assuming client object has base_currency
          icon="pending"
          color="red"
        />
        <StatsCard
          title="Total Invoices"
          value={invoices.length || 0}
          icon="invoices"
          color="blue"
        />
      </div>

      {/* Recent Invoices - Filtered for client */}
      <RecentInvoices invoices={invoices.slice(0, 5)} basePath="/portal/invoices" /> {/* Display top 5 recent invoices */}
    </div>
  );
};

export default ClientDashboard;