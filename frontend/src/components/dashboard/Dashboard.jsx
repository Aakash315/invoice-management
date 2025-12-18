import React from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import StatsCard from './StatsCard';
import RevenueChart from './RevenueChart';
import StatusChart from './StatusChart';
import RecentInvoices from './RecentInvoices';

const Dashboard = () => {
  const {
    stats,
    recentInvoices,
    monthlyRevenue,
    statusBreakdown,
    loading,
    error,
  } = useDashboard();

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`₹${stats?.total_revenue.toLocaleString() || 0}`}
          icon="revenue"
          color="green"
        />
        <StatsCard
          title="Total Invoices"
          value={stats?.total_invoices || 0}
          icon="invoices"
          color="blue"
        />
        <StatsCard
          title="Total Clients"
          value={stats?.total_clients || 0}
          icon="clients"
          color="yellow"
        />
        <StatsCard
          title="Pending Amount"
          value={`₹${stats?.pending_amount.toLocaleString() || 0}`}
          icon="pending"
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={monthlyRevenue || []} />
        <StatusChart data={statusBreakdown || []} />
      </div>

      {/* Recent Invoices */}
      <RecentInvoices invoices={recentInvoices || []} />
    </div>
  );
};

export default Dashboard;