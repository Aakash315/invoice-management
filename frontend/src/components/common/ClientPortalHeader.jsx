import React from 'react';
import { useClientAuth } from '../../hooks/useClientAuth';
import { useNavigate } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline'; // Reusing icon if needed

const ClientPortalHeader = ({ sidebarOpen, setSidebarOpen }) => {
  const { client, logout } = useClientAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/portal/login'); // Redirect to client login page
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            {/* Reusing sidebar toggle for mobile, if a sidebar is implemented */}
            {/* <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden mr-4 text-gray-600"
            >
              <Bars3Icon className="h-6 w-6" />
            </button> */}
            <h1 className="text-xl font-bold text-gray-900">
              Client Portal
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, {client?.name}
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClientPortalHeader;