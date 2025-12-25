import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ClientPortalHeader from './ClientPortalHeader'; // Import new header
import ClientPortalSidebar from './ClientPortalSidebar'; // Import new sidebar

const ClientPortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Enable sidebar state for mobile

  return (
    <div className="min-h-screen bg-gray-100">
      <ClientPortalHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex">
        <ClientPortalSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 p-6 lg:ml-64"> {/* Add lg:ml-64 for sidebar spacing */}
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientPortalLayout;