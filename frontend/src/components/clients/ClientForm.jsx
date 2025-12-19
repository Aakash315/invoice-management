import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { clientService } from '../../services/clientService';
import toast from 'react-hot-toast';

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string(),
    company: Yup.string(),
    address: Yup.string(),
    city: Yup.string(),
    state: Yup.string(),


    pincode: Yup.string().test('pincode-optional', 'Invalid pincode (must be 6 digits)', function(value) {
      if (!value || value.trim() === '') return true; // Optional field
      return /^\d{6}$/.test(value.trim());
    }),

    gstin: Yup.string().test('gstin-optional', 'Invalid GSTIN format', function(value) {
      if (!value || value.trim() === '') return true; // Optional field
      // Basic GSTIN validation pattern
      const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      return gstinPattern.test(value.trim().toUpperCase());
    }),
  });


  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstin: '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (id) {
          await clientService.update(id, values);
          toast.success('Client updated successfully');
        } else {
          await clientService.create(values);
          toast.success('Client created successfully');
        }
        navigate('/clients');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to save client');
      } finally {
        setLoading(false);
      }
    },
  });


  useEffect(() => {
    if (id) {
      const fetchClient = async () => {
        try {

          const data = await clientService.getById(id);
          // Handle different possible response structures
          const clientData = data.client || data.data || data;
          if (clientData && typeof clientData === 'object') {
            // Ensure all required fields exist with safe defaults
            const safeClientData = {
              name: clientData.name || '',
              email: clientData.email || '',
              phone: clientData.phone || '',
              company: clientData.company || '',
              address: clientData.address || '',
              city: clientData.city || '',
              state: clientData.state || '',
              pincode: clientData.pincode || '',
              gstin: clientData.gstin || '',
            };
            formik.setValues(safeClientData);
          } else {
            console.error('Invalid client data structure:', data);
            toast.error('Client not found or invalid data');
            navigate('/clients');
          }
        } catch (error) {
          console.error('Error fetching client:', error);
          toast.error('Failed to fetch client');
          navigate('/clients');
        } finally {
          setInitialLoading(false);
        }
      };

      fetchClient();
    }
  }, [id, navigate]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Client' : 'Add New Client'}
        </h1>
      </div>

      <form onSubmit={formik.handleSubmit} className="card space-y-6">
        {/* Basic Information */}
        <div className='m-10'>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
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
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`input-field ${
                  formik.touched.email && formik.errors.email ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
              )}
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

        {/* Tax Information */}
        <div className='m-10'>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tax Information
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSTIN
            </label>
            <input
              type="text"
              name="gstin"
              placeholder="22AAAAA0000A1Z5"
              value={formik.values.gstin}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`input-field ${
                formik.touched.gstin && formik.errors.gstin ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.gstin && formik.errors.gstin && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.gstin}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 pt-4 border-t m-10">
          <button
            type="submit"
            disabled={loading || !formik.isValid}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Client' : 'Create Client'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;