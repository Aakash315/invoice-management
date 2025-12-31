import React, { useState, useEffect, useRef } from 'react';
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
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [existingDocumentUrl, setExistingDocumentUrl] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: 'aadhar_card', label: 'Aadhar Card' },
    { value: 'pan_card', label: 'Pan Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'voter_id', label: 'Voter Id' },
    { value: 'driving_licence', label: 'Driving Licence' },
    { value: 'other', label: 'Other' },
  ];

  const depositTypes = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'upi', label: 'UPI' },
    { value: 'other', label: 'Other' },
  ];

  // Build validation schema based on whether we're creating or editing
  const getValidationSchema = () => {
    const baseSchema = {
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
    };

    // Only add password validation for new clients (when id is not present)
    if (!id) {
      baseSchema.password = Yup.string()
        .min(8, 'Password must be at least 8 characters long')
        .required('Password is required for new clients');
    }

    return Yup.object(baseSchema);
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '', // Only used for new clients
      is_portal_enabled: false, // New field
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstin: '',
      document_type: '',
      // Deposit fields
      has_deposit: false,
      deposit_amount: '',
      deposit_date: '',
      deposit_type: '',
    },
    enableReinitialize: true,
    validationSchema: getValidationSchema(),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const dataToSend = { ...values };
        if (id && !dataToSend.password) {
          delete dataToSend.password; // Don't send empty password on update
        }

        if (id) {
          const updatedClient = await clientService.update(id, dataToSend);
          console.log('Update response:', updatedClient);
          toast.success('Client updated successfully');
          
          // Upload document if selected
          if (documentFile && formik.values.document_type) {
            await uploadDocument(id);
          }
        } else {
          console.log('Creating new client with data:', dataToSend);
          const newClientResponse = await clientService.create(dataToSend);
          console.log('Create response received:', newClientResponse);
          console.log('Create response type:', typeof newClientResponse);
          console.log('Create response keys:', Object.keys(newClientResponse || {}));
          toast.success('Client created successfully');
          
          // Extract client ID from response
          let newClientId = extractClientId(newClientResponse);
          console.log('Extracted client ID:', newClientId, 'Type:', typeof newClientId);
          
          // If ID extraction failed, try to get the client by email
          if (!newClientId && newClientResponse?.email) {
            console.log('ID extraction failed, fetching client by email:', newClientResponse.email);
            try {
              const clients = await clientService.getAll();
              const createdClient = clients.find(c => c.email === newClientResponse.email);
              if (createdClient && createdClient.id) {
                newClientId = createdClient.id;
                console.log('Found client ID by email lookup:', newClientId);
              }
            } catch (fetchError) {
              console.error('Failed to fetch client by email:', fetchError);
            }
          }
          
          // Upload document if selected
          if (documentFile && formik.values.document_type && newClientId) {
            console.log('Proceeding to upload document for client ID:', newClientId, 'isValid:', !isNaN(newClientId) && newClientId > 0);
            if (isNaN(newClientId) || newClientId <= 0) {
              console.error('Invalid client ID:', newClientId);
              toast.error('Client created but document upload failed (invalid client ID)');
            } else {
              await uploadDocument(newClientId);
            }
          } else if (documentFile && formik.values.document_type) {
            console.error('Could not extract client ID from response - skipping document upload');
            toast.error('Client created but document upload failed');
          }
        }
        navigate('/clients');
      } catch (error) {
        console.error('Submit error:', error);
        toast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to save client');
      } finally {
        setLoading(false);
      }
    },
  });

  const uploadDocument = async (clientId) => {
    setUploadingDoc(true);
    try {
      console.log('Uploading document for client:', clientId);
      console.log('Document type:', formik.values.document_type);
      console.log('Document file:', documentFile);
      const result = await clientService.uploadDocument(clientId, formik.values.document_type, documentFile);
      console.log('Upload result:', result);
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Document upload error:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to upload document: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingDoc(false);
    }
  };

  // Helper to extract client ID from response
  const extractClientId = (response) => {
    console.log('Extracting client ID from response:', response);
    if (!response) return null;
    
    // Handle different response structures
    if (typeof response === 'number') return response;
    if (typeof response === 'string') return parseInt(response, 10);
    
    // Try direct id property
    if (response.id !== undefined && response.id !== null) {
      const id = parseInt(response.id, 10);
      console.log('Found direct id:', id);
      return id;
    }
    
    // Try nested client.id
    if (response.client?.id !== undefined && response.client?.id !== null) {
      const id = parseInt(response.client.id, 10);
      console.log('Found nested client.id:', id);
      return id;
    }
    
    // Try nested data.id
    if (response.data?.id !== undefined && response.data?.id !== null) {
      const id = parseInt(response.data.id, 10);
      console.log('Found nested data.id:', id);
      return id;
    }
    
    // Try _id (MongoDB style)
    if (response._id !== undefined && response._id !== null) {
      const id = parseInt(response._id, 10);
      console.log('Found _id:', id);
      return id;
    }
    
    console.log('Could not extract client ID from response');
    return null;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only images (JPEG, PNG, GIF) and PDF are allowed.');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setDocumentFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreview(null);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only images (JPEG, PNG, GIF) and PDF are allowed.');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setDocumentFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreview(null);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeDocument = () => {
    setDocumentFile(null);
    setDocumentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteExistingDocument = async () => {
    if (!id) return;
    
    try {
      await clientService.deleteDocument(id);
      formik.setFieldValue('document_type', '');
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error('Failed to delete document');
      console.error('Document delete error:', error);
    }
  };

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
              password: '', // Password is never pre-filled for security
              is_portal_enabled: clientData.is_portal_enabled || false, // Fetch existing status
              phone: clientData.phone || '',
              company: clientData.company || '',
              address: clientData.address || '',
              city: clientData.city || '',
              state: clientData.state || '',
              pincode: clientData.pincode || '',
              gstin: clientData.gstin || '',
              document_type: clientData.document_type || '',
              // Deposit fields
              has_deposit: clientData.has_deposit || false,
              deposit_amount: clientData.deposit_amount || '',
              deposit_date: clientData.deposit_date || '',
              deposit_type: clientData.deposit_type || '',
            };
            formik.setValues(safeClientData);
            
            // Fetch and display existing document
            if (clientData.document_type) {
              try {
                const documentBlob = await clientService.getDocument(id);
                const documentUrl = URL.createObjectURL(documentBlob);
                setExistingDocumentUrl(documentUrl);
                setDocumentPreview(documentUrl);
              } catch (docError) {
                console.log('No existing document or error fetching:', docError);
                setDocumentPreview('existing');
              }
            } else {
              setDocumentPreview(null);
            }
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
            
            {/* Password for Client Portal - Only show when creating new client */}
            {!id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-field ${
                    formik.touched.password && formik.errors.password ? 'border-red-500' : ''
                  }`}
                  autoComplete="new-password"
                />
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
                )}
              </div>
            )}

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
          </div> {/* End of grid-cols-1 md:grid-cols-2 gap-4 div */}
        </div> {/* End of m-10 div */}

        {/* Client Portal Access */}
        <div className='m-10'>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Client Portal Access
          </h2>
          <div className="flex items-center">
            <input
              id="is_portal_enabled"
              name="is_portal_enabled"
              type="checkbox"
              checked={formik.values.is_portal_enabled}
              onChange={formik.handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_portal_enabled" className="ml-2 block text-sm text-gray-900">
              Enable Client Portal Access
            </label>
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

        {/* Document Upload Section */}
        <div className='m-10'>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documents (Optional)
          </h2>
          <div className="space-y-4">
            {/* Document Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                name="document_type"
                value={formik.values.document_type}
                onChange={formik.handleChange}
                className="input-field"
              >
                <option value="">Select document type</option>
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  formik.values.document_type ? 'border-gray-300 hover:border-primary-500' : 'border-gray-300'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={!formik.values.document_type}
                />
                
                {!documentFile && !documentPreview ? (
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-primary-600 hover:text-primary-500">
                        Upload a file
                      </span>
                      {' or drag and drop'}
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF, PDF up to 5MB
                    </p>
                  </div>
                ) : documentFile ? (
                  <div className="space-y-4">
                    {documentPreview && (
                      <div className="relative">
                        {documentFile.type.startsWith('image/') ? (
                          <img
                            src={documentPreview}
                            alt="Document preview"
                            className="max-h-48 mx-auto rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="mt-2 text-sm text-gray-600">{documentFile.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-center space-x-4">
                      <span className="text-sm text-gray-600 truncate max-w-xs">
                        {documentFile?.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDocument();
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : existingDocumentUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      {existingDocumentUrl.toLowerCase().endsWith('.pdf') ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                          <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <a 
                            href={existingDocumentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-2 text-primary-600 hover:text-primary-800 font-medium"
                          >
                            View PDF Document
                          </a>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img
                            src={existingDocumentUrl}
                            alt="Existing document"
                            className="max-h-48 mx-auto rounded-lg shadow-md"
                          />
                          <a 
                            href={existingDocumentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                          >
                            <span className="text-white font-medium">View Full Size</span>
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <span className="text-sm text-gray-600">
                        Existing document uploaded
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteExistingDocument();
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : documentPreview === 'existing' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
                      <svg className="h-8 w-8 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-700 font-medium">Document already uploaded</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteExistingDocument();
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete existing document
                    </button>
                  </div>
                  ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Information Section */}
        <div className='m-10'>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Deposit Information (Optional)
          </h2>
          <div className="space-y-4">
            {/* Has Deposit Checkbox */}
            <div className="flex items-center">
              <input
                id="has_deposit"
                name="has_deposit"
                type="checkbox"
                checked={formik.values.has_deposit}
                onChange={formik.handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="has_deposit" className="ml-2 block text-sm text-gray-900">
                Client has paid deposit
              </label>
            </div>

            {/* Deposit Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Amount
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="deposit_amount"
                  value={formik.values.deposit_amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={!formik.values.has_deposit}
                  className={`input-field pl-7 ${!formik.values.has_deposit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Deposit Date and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Date
                </label>
                <input
                  type="date"
                  name="deposit_date"
                  value={formik.values.deposit_date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={!formik.values.has_deposit}
                  className={`input-field ${!formik.values.has_deposit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Type
                </label>
                <select
                  name="deposit_type"
                  value={formik.values.deposit_type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={!formik.values.has_deposit}
                  className={`input-field ${!formik.values.has_deposit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select deposit type</option>
                  {depositTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 pt-4 border-t m-10">
          <button
            type="submit"
            disabled={loading || uploadingDoc || !formik.isValid}
            className="btn-primary disabled:opacity-50"
          >
            {loading || uploadingDoc ? 'Saving...' : id ? 'Update Client' : 'Create Client'}
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

