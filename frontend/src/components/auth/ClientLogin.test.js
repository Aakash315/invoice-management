import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import ClientLogin from './ClientLogin';
import { ClientAuthContext } from '../../context/ClientAuthContext';
import toast from 'react-hot-toast';

// Mock the navigate function
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

const renderClientLogin = (isAuthenticated = false, loading = false) => {
  useNavigate.mockReturnValue(mockNavigate);
  return render(
    <ClientAuthContext.Provider value={{ login: mockLogin, isAuthenticated, loading }}>
      <BrowserRouter>
        <ClientLogin />
      </BrowserRouter>
    </ClientAuthContext.Provider>
  );
};

describe('ClientLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    renderClientLogin();
    expect(screen.getByText('Client Portal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    mockLogin.mockResolvedValueOnce({});
    renderClientLogin();

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { name: 'email', value: 'client@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { name: 'password', value: 'clientpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'client@example.com',
        password: 'clientpassword',
      });
      expect(toast.success).toHaveBeenCalledWith('Client login successful!');
      expect(mockNavigate).toHaveBeenCalledWith('/portal/dashboard');
    });
  });

  test('handles failed login', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid credentials' } },
    });
    renderClientLogin();

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { name: 'email', value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { name: 'password', value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('shows loading state during login', async () => {
    mockLogin.mockReturnValueOnce(new Promise(() => {})); // Never resolves
    renderClientLogin();

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { name: 'email', value: 'client@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { name: 'password', value: 'clientpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    // Clean up mock to prevent open handles
    mockLogin.mockRestore();
  });
});
