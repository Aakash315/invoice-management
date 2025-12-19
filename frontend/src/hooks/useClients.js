import { useState, useEffect } from 'react';
import { clientService } from '../services/clientService';
import toast from 'react-hot-toast';

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientService.getAll();
      setClients(data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch clients';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const createClient = async (clientData) => {
    try {
      const data = await clientService.create(clientData);
      setClients([data, ...clients]);
      toast.success('Client created successfully');
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create client';
      toast.error(errorMessage);
      throw err;
    }
  };


  const updateClient = async (id, clientData) => {
    try {
      const data = await clientService.update(id, clientData);
      setClients(clients.map((c) => (c.id === id ? data : c)));
      toast.success('Client updated successfully');
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update client';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteClient = async (id) => {
    try {
      await clientService.delete(id);
      setClients(clients.filter((c) => c.id !== id));
      toast.success('Client deleted successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete client';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  };
};