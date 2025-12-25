import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { clientPortalService } from '../../services/clientPortalService';
import toast from 'react-hot-toast';
import { useClientAuth } from '../../hooks/useClientAuth';

const ClientProfileEditor = () => {
  const navigate = useNavigate();
  const { client, loading: authLoading, isAuthenticated, login } = useClientAuth(); // 'login' is used to refresh client data in context
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Validation schema for client-editable fields
  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    company: Yup.string(),
    phone: Yup.string(),
    address: Yup.string(),
    city: Yup.string(),
    state: Yup.string(),
    pincode: Yup.string().test('pincode-optional', 'Invalid pincode (must be 6 digits)', function(value) {
      if (!value || value.trim() === '') return true; // Optional field
      return /^\d{6}$/.test(value.trim());
    }),
  });

  const formik = useFormik({
    initialValues: {
      name: client?.name || '',
      company: client?.company || '',
      phone: client?.phone || '',
      address: client?.address || '',
      city: client?.city || '',
      state: client?.state || '',
      pincode: client?.pincode || '',
    },
    enableReinitialize: true, // Recalculate initial values when client changes
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await clientPortalService.updateClientProfile(values);
        // Refresh client data in context
        // A simple way is to re-fetch the client data or re-login silently
        // For now, let's assume the client object in context can be partially updated
        // Or, we can trigger a re-login using the current credentials if stored (not ideal)
        // A better approach is for the backend to return the updated client and update context
        toast.success('Profile updated successfully');
        // This is a simplified way to update the client object in context,
        // ideally, the login function should accept an updated client object or refetch it.
        // For now, assuming the context state can be directly set with the returned data.
        const updatedClient = { ...client, ...values };
        login(updatedClient); // This is a hack, login expects credentials. Revisit this.
        navigate('/portal/dashboard'); // Navigate back to dashboard after update
      } catch (error) {
        toast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to update profile');
      } finally {
        setLoading(false);
      }
    },
  });

  // Effect to load initial client data into the form
  useEffect(() => {
    if (!authLoading && isAuthenticated && client) {
      formik.setValues({
        name: client.name || '',
        company: client.company || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        pincode: client.pincode || '',
      });
      setInitialLoading(false);
    } else if (!authLoading && !isAuthenticated) {
      navigate('/portal/login'); // Redirect if not authenticated
    }
  }, [authLoading, isAuthenticated, client, navigate]);

  if (initialLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Your Profile</h1>
      </div>

      <form onSubmit={formik.handleSubmit} className="card space-y-6">
        {/* Basic Information */}
        <div className='m-10'>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`input-field ${
                  formik.touched.name && formik.errors.name ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formik.values.company}
                onChange={formik.handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Read Only)
              </label>
              <input
                type="email"
                name="email"
                value={client?.email || ''} // Display from context, not editable
                className="input-field bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className='m-10'>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Address Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                rows={3}
                value={formik.values.address}
                onChange={formik.handleChange}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formik.values.pincode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-field ${
                    formik.touched.pincode && formik.errors.pincode
                      ? 'border-red-500'
                      : ''
                  }`}
                />
                {formik.touched.pincode && formik.errors.pincode && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.pincode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tax Information - Read Only */}
        <div className='m-10'>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tax Information (Read Only)
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSTIN
            </label>
            <input
              type="text"
              name="gstin"
              value={client?.gstin || ''} // Display from context, not editable
              className="input-field bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 pt-4 border-t m-10">
          <button
            type="submit"
            disabled={loading || !formik.isValid}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update Profile'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/portal/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientProfileEditor;