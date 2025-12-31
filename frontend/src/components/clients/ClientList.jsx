import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClients } from '../../hooks/useClients';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const ClientList = () => {
  const { clients, loading, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('clientSearchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, client: null });
  const navigate = useNavigate();

  // Maximum number of search history items to store
  const MAX_HISTORY_ITEMS = 10;

  // Save search history to localStorage
  useEffect(() => {
    localStorage.setItem('clientSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Handle click outside to close search history dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add search term to history
  const addToSearchHistory = (term) => {
    if (!term || term.trim() === '') return;
    
    const trimmedTerm = term.trim();
    setSearchHistory(prev => {
      // Remove duplicates (case insensitive)
      const filtered = prev.filter(item => 
        item.toLowerCase() !== trimmedTerm.toLowerCase()
      );
      // Add new term at the beginning and limit size
      return [trimmedTerm, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  // Remove single item from history
  const removeFromSearchHistory = (term, e) => {
    e.stopPropagation();
    setSearchHistory(prev => prev.filter(item => item !== term));
  };

  // Clear all search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    toast.success('Search history cleared');
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      addToSearchHistory(searchTerm);
      setIsSearchFocused(false);
    }
  };

  // Handle clicking on a history item
  const handleHistoryItemClick = (term) => {
    setSearchTerm(term);
    setIsSearchFocused(false);
  };

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
    <div className="space-y-6 mt-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Link to="/clients/new" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Client
        </Link>
      </div>

      {/* Search */}
      <div className="card p-5 overflow-visible">
        <div className="relative" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search clients by name, email, or company..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              className="block w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </form>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            ) : (
              <span className="text-gray-300 text-xs border border-gray-300 rounded px-1.5 py-0.5">Enter</span>
            )}
          </div>
          
          {/* Search History Dropdown */}
          {isSearchFocused && (searchHistory.length > 0 || searchTerm.length > 0) && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
              {searchHistory.length > 0 ? (
                <>
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Recent searches
                    </div>
                    <button
                      onClick={clearSearchHistory}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center"
                    >
                      <TrashIcon className="h-3 w-3 mr-1" />
                      Clear all
                    </button>
                  </div>
                  <ul>
                    {searchHistory.map((term, index) => (
                      <li
                        key={`${term}-${index}`}
                        onClick={() => handleHistoryItemClick(term)}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                      >
                        <span className="text-sm text-gray-700">{term}</span>
                        <button
                          onClick={(e) => removeFromSearchHistory(term, e)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No recent searches yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between m-5">
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

            <div className="mt-4 flex items-center space-x-2 m-5">
              <button
                onClick={() => navigate(`/clients/${client.id}`)}
                className="flex-1 bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors text-sm flex items-center justify-center"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                View
              </button>
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