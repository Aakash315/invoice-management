import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClients } from '../../hooks/useClients';
import { clientService } from '../../services/clientService';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  PencilIcon,
  EyeIcon,
  BanknotesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const DepositList = () => {
  const { clients, loading, refetch } = useClients();
  const [filter, setFilter] = useState('with_deposit');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [returning, setReturning] = useState(false);
  const [returnType, setReturnType] = useState('cash');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [depositHistory, setDepositHistory] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: '',
    return_type: 'cash',
    notes: ''
  });
  const navigate = useNavigate();

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((client) => client.has_deposit);
  }, [clients]);

  const handleReturnDeposit = async () => {
    if (!selectedClient) return;
    
    setReturning(true);
    try {
      await clientService.returnDeposit(selectedClient.id, returnType);
      toast.success(`Deposit returned successfully for ${selectedClient.name}`);
      setReturnModalOpen(false);
      setSelectedClient(null);
      refetch();
    } catch (error) {
      console.error('Return deposit error:', error);
      toast.error(error.response?.data?.detail || 'Failed to return deposit');
    } finally {
      setReturning(false);
    }
  };

  const openReturnModal = (client) => {
    setSelectedClient(client);
    setReturnType('cash');
    setReturnModalOpen(true);
  };

  const loadDepositHistory = async () => {
    setHistoryLoading(true);
    try {
      const history = await clientService.getAllDepositHistory();
      setDepositHistory(history);
    } catch (error) {
      console.error('Error loading deposit history:', error);
      toast.error('Failed to load deposit history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'history') {
      loadDepositHistory();
    }
  };

  const openEditModal = (item) => {
    setSelectedHistory(item);
    setEditForm({
      amount: item.amount?.toString() || '',
      return_type: item.return_type || 'cash',
      notes: item.notes || ''
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (item) => {
    setSelectedHistory(item);
    setDeleteModalOpen(true);
  };

  const handleUpdateHistory = async () => {
    if (!selectedHistory) return;
    
    setEditing(true);
    try {
      await clientService.updateDepositHistory(selectedHistory.id, {
        amount: parseFloat(editForm.amount),
        return_type: editForm.return_type,
        notes: editForm.notes
      });
      toast.success('Deposit history updated successfully');
      setEditModalOpen(false);
      setSelectedHistory(null);
      loadDepositHistory();
    } catch (error) {
      console.error('Update history error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update deposit history');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!selectedHistory) return;
    
    setDeleting(true);
    try {
      await clientService.deleteDepositHistory(selectedHistory.id);
      toast.success('Deposit history deleted successfully');
      setDeleteModalOpen(false);
      setSelectedHistory(null);
      loadDepositHistory();
    } catch (error) {
      console.error('Delete history error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete deposit history');
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    if (!clients) return { withDeposit: 0, totalAmount: 0 };

    const withDeposit = clients.filter(c => c.has_deposit);
    const totalAmount = withDeposit.reduce((sum, c) => sum + (c.deposit_amount || 0), 0);

    return {
      withDeposit: withDeposit.length,
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Clients With Deposit</p>
          <p className="text-2xl font-bold text-green-600">{stats.withDeposit}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total Deposit Amount</p>
          <p className="text-2xl font-bold text-primary-600">
            ₹{stats.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Avg. Deposit</p>
          <p className="text-2xl font-bold text-gray-600">
            ₹{stats.withDeposit > 0 ? Math.round(stats.totalAmount / stats.withDeposit).toLocaleString() : 0}
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('with_deposit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'with_deposit'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            With Deposit ({stats.withDeposit})
          </button>
          <button
            onClick={() => handleFilterChange('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              filter === 'history'
                ? 'bg-amber-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ClockIcon className="w-4 h-4 mr-2" />
            History
          </button>
        </div>
      </div>

      {filter === 'history' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-amber-50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-amber-600" />
              Deposit Return History
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Track all deposit returns made to clients
            </p>
          </div>
          <div className="overflow-x-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              </div>
            ) : depositHistory.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Returned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {depositHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{item.client_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.company || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">₹{item.amount?.toLocaleString() || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {item.returned_date ? new Date(item.returned_date).toLocaleString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 max-w-xs truncate">{item.notes || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {item.return_type ? item.return_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => openEditModal(item)} className="text-primary-600 hover:text-primary-700 px-3 py-1 rounded text-sm" title="Edit">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => openDeleteModal(item)} className="text-red-600 hover:text-red-700 px-3 py-1 rounded text-sm" title="Delete">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No deposit history</h3>
                <p className="mt-1 text-sm text-gray-500">Deposit returns will be tracked here once processed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {filter === 'with_deposit' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.company || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{client.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">₹{client.deposit_amount?.toLocaleString() || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {client.deposit_date ? new Date(client.deposit_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {client.deposit_type ? client.deposit_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => navigate(`/clients/${client.id}`)} className="text-primary-600 hover:text-primary-700 px-3 py-1 rounded text-sm" title="View Details">
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => navigate(`/clients/edit/${client.id}`)} className="text-gray-600 hover:text-gray-700 px-3 py-1 rounded text-sm" title="Edit">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => openReturnModal(client)} className="text-green-600 hover:text-green-700 px-3 py-1 rounded text-sm" title="Return Deposit">
                          <BanknotesIcon className="h-5 w-5" />
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No clients with deposits</h3>
                <p className="mt-1 text-sm text-gray-500">No clients currently have deposits paid.</p>
                <div className="mt-6">
                  <Link to="/clients/new" className="btn-primary inline-flex items-center">
                    <CurrencyRupeeIcon className="h-5 w-5 mr-2" />
                    Add New Client
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {returnModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setReturnModalOpen(false)} />
            <div className="relative inline-block p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mr-3 rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Return Deposit</h3>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to return the deposit for{' '}
                  <span className="font-medium text-gray-900">{selectedClient.name}</span>?
                </p>
                {selectedClient.deposit_amount && (
                  <p className="mt-2 text-sm text-gray-500">
                    Deposit amount: <span className="font-medium text-gray-900">₹{selectedClient.deposit_amount.toLocaleString()}</span>
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">This action will remove the deposit from this client's record.</p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Return Type</label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-4 py-2 border"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setReturnModalOpen(false)} disabled={returning} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="button" onClick={handleReturnDeposit} disabled={returning} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center">
                  {returning ? 'Processing...' : 'Return Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && selectedHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setEditModalOpen(false)} />
            <div className="relative inline-block p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mr-3 rounded-full bg-primary-100">
                  <PencilIcon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Edit Deposit History</h3>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-4">
                  Edit deposit return record for <span className="font-medium text-gray-900">{selectedHistory.client_name}</span>
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Returned (₹)</label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2 border"
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Return Type</label>
                  <select
                    value={editForm.return_type}
                    onChange={(e) => setEditForm({ ...editForm, return_type: e.target.value })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2 border"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2 border"
                    placeholder="Enter notes"
                    rows="3"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setEditModalOpen(false)} disabled={editing} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="button" onClick={handleUpdateHistory} disabled={editing || !editForm.amount} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && selectedHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setDeleteModalOpen(false)} />
            <div className="relative inline-block p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mr-3 rounded-full bg-red-100">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Delete Deposit History</h3>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this deposit return record for{' '}
                  <span className="font-medium text-gray-900">{selectedHistory.client_name}</span>?
                </p>
                {selectedHistory.amount && (
                  <p className="mt-2 text-sm text-gray-500">
                    Amount: <span className="font-medium text-gray-900">₹{selectedHistory.amount.toLocaleString()}</span>
                  </p>
                )}
                <p className="mt-2 text-sm text-red-600">This action cannot be undone.</p>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setDeleteModalOpen(false)} disabled={deleting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteHistory} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositList;

