import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClientAuth } from '../../hooks/useClientAuth';

const ClientLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState(''); // General error message
  const { login } = useClientAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when user types
    setEmailError('');
    setPasswordError('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEmailError('');
    setPasswordError('');
    setFormError('');

    try {
      await login(formData);
      navigate('/portal', { replace: true });
    } catch (error) {
      const backendErrorMessage = error.response?.data?.detail || error.response?.data?.error || 'Client login failed';
      console.log("Backend error message:", backendErrorMessage);
      
      // Determine where to display the error
      if (backendErrorMessage.includes('email') || backendErrorMessage.includes('password')) {
        // If the error explicitly mentions email or password, display it generally
        setFormError(backendErrorMessage);
      } else if (backendErrorMessage.includes('access is not enabled')) {
        setFormError(backendErrorMessage);
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Client Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your client account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {formError && (
            <div className="text-red-600 text-center text-sm mb-4">{formError}</div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                aria-invalid={emailError ? "true" : "false"}
                aria-describedby="email-error"
              />
              {emailError && <p className="mt-1 text-sm text-red-600" id="email-error">{emailError}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                aria-invalid={passwordError ? "true" : "false"}
                aria-describedby="password-error"
              />
              {passwordError && <p className="mt-1 text-sm text-red-600" id="password-error">{passwordError}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Link for client-specific password reset/registration will be added later */}
          <div className="text-center">
            <Link
              to="/portal/forgot-password" // Placeholder
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientLogin;