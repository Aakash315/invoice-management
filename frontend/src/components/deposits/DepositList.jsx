import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClients } from '../../hooks/useClients';
import {
  ArrowLeftIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';

const DepositList = () => {
  const { clients, loading } = useClients();
  const [filter, setFilter] = useState('all'); // 'all', 'with_deposit', 'without_deposit'
  const navigate = useNavigate();

  // Filter clients based on deposit status
  const filteredClients = useMemo(() => {
    if (!clients) return [];

    return clients.filter((client) => {
      if (filter === 'with_deposit') return client.has_deposit;
      if (filter === 'without_deposit') return !client.has_deposit;
      return true;
    });
  }, [clients, filter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!clients) return { total: 0, withDeposit: 0, withoutDeposit: 0, totalAmount: 0 };

    const withDeposit = clients.filter(c => c.has_deposit);
    const totalAmount = withDeposit.reduce((sum, c) => sum + (c.deposit_amount || 0), 0);

    return {
      total: clients.length,
      withDeposit: withDeposit.length,
      withoutDeposit: clients.length - withDeposit.length,
      totalAmount,
    };
  }, [clients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/clients')}
            className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deposits</h1>
            <p className="text-sm text-gray-500 mt-1">Manage client deposits</p>
          </div>
        </div>
        <Link to="/clients/new" className="btn-primary flex items-center">
          <CurrencyRupeeIcon className="h-5 w-5 mr-2" />
          Add New Client
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total Clients</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">With Deposit</p>
          <p className="text-2xl font-bold text-green-600">{stats.withDeposit}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Without Deposit</p>
          <p className="text-2xl font-bold text-gray-600">{stats.withoutDeposit}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total Deposit Amount</p>
          <p className="text-2xl font-bold text-primary-600">
            ₹{stats.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Clients ({stats.total})
          </button>
          <button
            onClick={() => setFilter('with_deposit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'with_deposit'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            With Deposit ({stats.withDeposit})
          </button>
          <button
            onClick={() => setFilter('without_deposit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'without_deposit'
                ? 'bg-gray-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Without Deposit ({stats.withoutDeposit})
          </button>
        </div>
      </div>

      {/* Deposit List Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deposit Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deposit Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deposit Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deposit Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {client.company || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {client.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {client.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.has_deposit ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CurrencyRupeeIcon className="w-3 h-3 mr-1" />
                        Deposit Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        No Deposit
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.has_deposit ? (
                        <span className="text-green-600">
                          ₹{client.deposit_amount?.toLocaleString() || 0}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {client.has_deposit && client.deposit_date
                        ? new Date(client.deposit_date).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {client.has_deposit && client.deposit_type
                        ? client.deposit_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="text-primary-600 hover:text-primary-700 px-3 py-1 rounded text-sm"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/clients/edit/${client.id}`)}
                        className="text-gray-600 hover:text-gray-700 px-3 py-1 rounded text-sm"
                        title="Edit"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <CurrencyRupeeIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'with_deposit'
                  ? 'No clients with deposits found'
                  : filter === 'without_deposit'
                    ? 'No clients without deposits found'
                    : 'Get started by adding a new client'}
              </p>
              <div className="mt-6">
                <Link
                  to="/clients/new"
                  className="btn-primary inline-flex items-center"
                >
                  <CurrencyRupeeIcon className="h-5 w-5 mr-2" />
                  Add New Client
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12 card">
          <CurrencyRupeeIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'with_deposit'
              ? 'No clients with deposits found'
              : filter === 'without_deposit'
                ? 'No clients without deposits found'
                : 'Get started by adding a new client'}
          </p>
          <div className="mt-6">
            <Link
              to="/clients/new"
              className="btn-primary inline-flex items-center"
            >
              <CurrencyRupeeIcon className="h-5 w-5 mr-2" />
              Add New Client
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositList;

