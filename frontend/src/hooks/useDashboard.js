import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import toast from 'react-hot-toast';

export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [currencyBreakdown, setCurrencyBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getStats();
      
      setStats(data.stats);
      setRecentInvoices(data.recent_invoices);
      setMonthlyRevenue(data.monthly_revenue);
      setStatusBreakdown(data.status_breakdown);
      setCurrencyBreakdown(data.currency_breakdown);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    recentInvoices,
    monthlyRevenue,
    statusBreakdown,
    currencyBreakdown,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};