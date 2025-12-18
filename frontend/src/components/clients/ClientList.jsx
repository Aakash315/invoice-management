import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClients } from '../../hooks/useClients';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const ClientList = () => {
  const { clients, loading, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, client: null });
  const navigate = useNavigate();

  // Filter clients based on search
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async () => {
    if (deleteModal.client) {
      try {
        await deleteClient(deleteModal.client.id);
        setDeleteModal({ isOpen: false, client: null });
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Link to="/clients/new" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Client
        </Link>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search clients by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                {client.company && (
                  <p className="text-sm text-gray-600 mt-1">{client.company}</p>
                )}
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {client.email}
                  </p>
                  {client.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {client.phone}
                    </p>
                  )}
                  {client.city && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">City:</span> {client.city}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-2">
              <button
                onClick={() => navigate(`/clients/edit/${client.id}`)}
                className="flex-1 btn-secondary text-sm flex items-center justify-center"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => setDeleteModal({ isOpen: true, client })}
                className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center justify-center"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12 card">
          <p className="text-gray-500">
            {searchTerm ? 'No clients found matching your search' : 'No clients yet'}
          </p>
          {!searchTerm && (
            <Link to="/clients/new" className="btn-primary mt-4 inline-flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Client
            </Link>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, client: null })}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteModal.client?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ClientList;