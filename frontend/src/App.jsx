import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClientAuthProvider } from './context/ClientAuthContext';
import { Toaster } from 'react-hot-toast';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ClientLogin from './components/auth/ClientLogin';
import ClientProtectedRoute from './components/auth/ClientProtectedRoute';
import ClientForgotPassword from './components/auth/ClientForgotPassword';
import ClientResetPassword from './components/auth/ClientResetPassword';

// Main Components
import Layout from './components/common/Layout';
import ClientPortalLayout from './components/common/ClientPortalLayout';
import Dashboard from './components/dashboard/Dashboard';
import ClientDashboard from './components/dashboard/ClientDashboard';
import ClientList from './components/clients/ClientList';
import ClientProfileEditor from './components/clients/ClientProfileEditor';
import ClientForm from './components/clients/ClientForm';
import InvoiceList from './components/invoices/InvoiceList';
import InvoiceForm from './components/invoices/InvoiceForm';
import InvoiceView from './components/invoices/InvoiceView';
import ClientInvoiceList from './components/invoices/ClientInvoiceList';
import ClientInvoiceView from './components/invoices/ClientInvoiceView';
import RecurringInvoiceList from './components/invoices/RecurringInvoiceList';
import RecurringInvoiceForm from './components/invoices/RecurringInvoiceForm';
import RecurringInvoiceView from './components/invoices/RecurringInvoiceView';
import Reports from './components/reports/Reports';
import ClientPaymentHistory from './components/payments/ClientPaymentHistory';
import ReminderSettings from './components/settings/ReminderSettings';

function App() {
  return (
    <AuthProvider>
      <ClientAuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes> {/* Consolidated Routes */}
            {/* Public Routes for Internal Users */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes for Internal Users */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              
              <Route path="clients" element={<ClientList />} />
              <Route path="clients/new" element={<ClientForm />} />
              <Route path="clients/edit/:id" element={<ClientForm />} />
              
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/edit/:id" element={<InvoiceForm />} />
              <Route path="invoices/view/:id" element={<InvoiceView />} />
              
              <Route path="recurring-invoices" element={<RecurringInvoiceList />} />
              <Route path="recurring-invoices/new" element={<RecurringInvoiceForm />} />
              <Route path="recurring-invoices/edit/:id" element={<RecurringInvoiceForm />} />
              <Route path="recurring-invoices/view/:id" element={<RecurringInvoiceView />} />

              <Route path="reports" element={<Reports />} />
              <Route path="settings/reminders" element={<ReminderSettings />} />
            </Route>

            {/* Client Portal Public Routes */}
            <Route path="/portal/login" element={<ClientLogin />} />
            <Route path="/portal/forgot-password" element={<ClientForgotPassword />} />
            <Route path="/portal/reset-password" element={<ClientResetPassword />} />

            {/* Client Portal Protected Routes */}
            <Route
              path="/portal"
              element={
                <ClientProtectedRoute>
                  <ClientPortalLayout />
                </ClientProtectedRoute>
              }
            >
              <Route index element={<ClientDashboard />} />
              <Route path="invoices" element={<ClientInvoiceList />} />
              <Route path="invoices/:id" element={<ClientInvoiceView />} />
              <Route path="payments" element={<ClientPaymentHistory />} />
              <Route path="profile" element={<ClientProfileEditor />} />
            </Route>

            {/* Fallback for non-matching URLs */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ClientAuthProvider>
    </AuthProvider>
  );
}

export default App;