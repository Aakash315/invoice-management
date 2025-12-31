import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import {
  ArrowLeftIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ClientView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [documentType, setDocumentType] = useState(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const data = await clientService.getById(id);
        const clientData = data.client || data.data || data;
        
        if (clientData && typeof clientData === 'object') {
          setClient(clientData);
          
          // Fetch document if exists
          if (clientData.document_type) {
            setDocumentType(clientData.document_type);
            try {
              const documentBlob = await clientService.getDocument(id);
              const url = URL.createObjectURL(documentBlob);
              setDocumentUrl(url);
            } catch (docError) {
              console.log('No document available:', docError);
            }
          }
        } else {
          toast.error('Client not found');
          navigate('/clients');
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        toast.error('Failed to fetch client');
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const documentTypeLabels = {
    aadhar_card: 'Aadhar Card',
    pan_card: 'Pan Card',
    passport: 'Passport',
    voter_id: 'Voter ID',
    driving_licence: 'Driving Licence',
    other: 'Other',
  };

  return (
    <div className="max-w-4xl mx-auto mt-20">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Client Details</h1>
        </div>
        <Link
          to={`/clients/edit/${id}`}
          className="btn-primary flex items-center"
        >
          <PencilIcon className="h-5 w-5 mr-2" />
          Edit Client
        </Link>
      </div>

      {/* Basic Information */}
      <div className="card mb-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{client.name || '-'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{client.email || '-'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <PhoneIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{client.phone || '-'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium text-gray-900">{client.company || '-'}</p>
              </div>
            </div>
          </div>

          {/* Portal Access Badge */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                client.is_portal_enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {client.is_portal_enabled ? '✓' : '✗'} Client Portal Access
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="card mb-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Address Information</h2>
        </div>
        <div className="p-6">
          {client.address || client.city || client.state || client.pincode ? (
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <MapPinIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <div className="mt-1 space-y-1">
                  {client.address && (
                    <p className="font-medium text-gray-900">{client.address}</p>
                  )}
                  <p className="text-gray-600">
                    {[client.city, client.state, client.pincode]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No address information provided</p>
          )}
        </div>
      </div>

      {/* Tax Information */}
      <div className="card mb-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Tax Information</h2>
        </div>
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">GSTIN</p>
              <p className="font-medium text-gray-900">{client.gstin || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        </div>
        <div className="p-6">
          {documentUrl ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Document Type</p>
                  <p className="font-medium text-gray-900">
                    {documentTypeLabels[documentType] || documentType || 'Document'}
                  </p>
                </div>
              </div>
              
              {/* Document Preview */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {documentUrl.toLowerCase().endsWith('.pdf') || documentType === 'pan_card' ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 text-primary-600 hover:text-primary-800 font-medium flex items-center"
                    >
                      View PDF Document
                      <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      src={documentUrl}
                      alt="Client Document"
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <span className="text-white font-medium flex items-center">
                        View Full Size
                        <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : client.document_type ? (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Document Type</p>
                <p className="font-medium text-gray-900">
                  {documentTypeLabels[client.document_type] || client.document_type}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No document uploaded</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientView;

