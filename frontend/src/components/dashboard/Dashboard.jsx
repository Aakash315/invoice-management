import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { expenseService } from '../../services/expenseService';
import StatsCard from './StatsCard';
import RevenueChart from './RevenueChart';
import StatusChart from './StatusChart';
import RecentInvoices from './RecentInvoices';
import CurrencyBreakdown from './CurrencyBreakdown';

const Dashboard = () => {
  const {
    stats,
    recentInvoices,
    monthlyRevenue,
    statusBreakdown,
    currencyBreakdown,
    loading,
    error,
  } = useDashboard();

  const [profitStats, setProfitStats] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [expenseLoading, setExpenseLoading] = useState(true);

  // Fetch expense and profit data
  useEffect(() => {
    const fetchExpenseData = async () => {
      try {
        setExpenseLoading(true);
        
        // Get profit dashboard data
        const profitData = await expenseService.getProfitDashboard();
        setProfitStats(profitData);

        // Get expense summary for current month
        const currentMonth = new Date();
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
          .toISOString().split('T')[0];
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
          .toISOString().split('T')[0];

        const expenseSummary = await expenseService.getExpenseSummary(startDate, endDate);
        setExpenseData(expenseSummary);
      } catch (error) {
        console.warn('Failed to fetch expense data:', error);
        // Set default empty data to prevent crashes
        setProfitStats({
          total_revenue: 0,
          total_expenses: 0,
          total_profit: 0,
          profit_margin: 0,
          monthly_trends: []
        });
        setExpenseData({
          total_expenses: 0,
          expense_count: 0,
          category_breakdown: []
        });
      } finally {
        setExpenseLoading(false);
      }
    };

    if (!loading) {
      fetchExpenseData();
    }
  }, [loading]);

  if (loading || expenseLoading) {
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
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`${stats?.total_revenue.toLocaleString() || 0}`}
          currency={stats?.total_revenue_base_currency}
          icon="revenue"
          color="green"
        />
        <StatsCard
          title="Total Expenses"
          value={`${(expenseData?.total_expenses || 0).toLocaleString()}`}
          currency={stats?.total_revenue_base_currency}
          icon="expenses"
          color="orange"
        />
        <StatsCard
          title="Net Profit"
          value={`${(profitStats?.total_profit || 0).toLocaleString()}`}
          currency={stats?.total_revenue_base_currency}
          icon="profit"
          color={profitStats?.total_profit >= 0 ? "green" : "red"}
          subtitle={`${(profitStats?.profit_margin || 0).toFixed(1)}% margin`}
        />
        <StatsCard
          title="Total Invoices"
          value={stats?.total_invoices || 0}
          icon="invoices"
          color="blue"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Clients"
          value={stats?.total_clients || 0}
          icon="clients"
          color="yellow"
        />
        <StatsCard
          title="Pending Amount"
          value={`${stats?.pending_amount.toLocaleString() || 0}`}
          currency={stats?.pending_amount_base_currency}
          icon="pending"
          color="red"
        />
        <StatsCard
          title="This Month Expenses"
          value={`${(expenseData?.total_expenses || 0).toLocaleString()}`}
          currency={stats?.total_revenue_base_currency}
          icon="expenses"
          color="orange"
          subtitle={`${expenseData?.expense_count || 0} transactions`}
        />
        <StatsCard
          title="Profit Margin"
          value={`${(profitStats?.profit_margin || 0).toFixed(1)}%`}
          icon="profit"
          color={profitStats?.profit_margin >= 0 ? "green" : "red"}
          subtitle={profitStats?.profit_margin >= 0 ? "Healthy" : "Needs attention"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={monthlyRevenue || []} />
        <StatusChart data={statusBreakdown || []} />
      </div>

      {/* Currency Breakdown */}
      <CurrencyBreakdown data={currencyBreakdown || []} baseCurrency={stats?.total_revenue_base_currency} />

      {/* Recent Invoices */}
      <RecentInvoices invoices={recentInvoices || []} />
    </div>
  );
};

export default Dashboard;