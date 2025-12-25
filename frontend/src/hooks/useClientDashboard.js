import { useState, useEffect, useCallback } from 'react';
import { clientPortalService } from '../services/clientPortalService';
import { useClientAuth } from './useClientAuth';
import toast from 'react-hot-toast';

export const useClientDashboard = () => {
  const { isAuthenticated, loading: authLoading } = useClientAuth();
  const [invoices, setInvoices] = useState([]);
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientDashboardData = useCallback(async () => {
    if (!isAuthenticated) {
      setDashboardLoading(false);
      return;
    }

    setDashboardLoading(true);
    setError(null);
    try {
      const data = await clientPortalService.getClientDashboardData();
      setInvoices(data.recent_invoices);
      setOutstandingAmount(data.outstanding_amount);
    } catch (err) {
      console.error("Error fetching client dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      toast.error("Failed to load dashboard data.");
    } finally {
      setDashboardLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchClientDashboardData();
    }
  }, [authLoading, fetchClientDashboardData]);

  return {
    invoices,
    outstandingAmount,
    loading: authLoading || dashboardLoading,
    error,
    refetch: fetchClientDashboardData,
  };
};
