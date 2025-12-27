import { useMemo } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';

export const useApi = () => {
  const { user } = useAuth();

  const get = useMemo(() => async (url) => {
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const post = useMemo(() => async (url, data) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const put = useMemo(() => async (url, data) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const patch = useMemo(() => async (url, data) => {
    try {
      const response = await api.patch(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const del = useMemo(() => async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  return useMemo(() => ({
    get,
    post,
    put,
    patch,
    del,
    user,
    isAuthenticated: !!user
  }), [get, post, put, patch, del, user]);
};

