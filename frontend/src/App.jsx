import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Main Components
import Layout from './components/common/Layout';
import Dashboard from './components/dashboard/Dashboard';
import ClientList from './components/clients/ClientList';
import ClientForm from './components/clients/ClientForm';
import InvoiceList from './components/invoices/InvoiceList';
import InvoiceForm from './components/invoices/InvoiceForm';
import InvoiceView from './components/invoices/InvoiceView';
import RecurringInvoiceList from './components/invoices/RecurringInvoiceList';
import RecurringInvoiceForm from './components/invoices/RecurringInvoiceForm';
import RecurringInvoiceView from './components/invoices/RecurringInvoiceView';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            
            {/* Client Routes */}
            <Route path="clients" element={<ClientList />} />
            <Route path="clients/new" element={<ClientForm />} />
            <Route path="clients/edit/:id" element={<ClientForm />} />
            
            {/* Invoice Routes */}
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/new" element={<InvoiceForm />} />
            <Route path="invoices/edit/:id" element={<InvoiceForm />} />
            <Route path="invoices/view/:id" element={<InvoiceView />} />
            
            {/* Recurring Invoice Routes */}
            <Route path="recurring-invoices" element={<RecurringInvoiceList />} />
            <Route path="recurring-invoices/new" element={<RecurringInvoiceForm />} />
            <Route path="recurring-invoices/edit/:id" element={<RecurringInvoiceForm />} />
            <Route path="recurring-invoices/view/:id" element={<RecurringInvoiceView />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;