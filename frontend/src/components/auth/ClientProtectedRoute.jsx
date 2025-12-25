import React from 'react';
import { Navigate } from 'react-router-dom';
import { useClientAuth } from '../../hooks/useClientAuth';

const ClientProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isLoggingIn } = useClientAuth();

  if (loading || isLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  return children;
};

export default ClientProtectedRoute;