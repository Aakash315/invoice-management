import React, { useState } from 'react';
import RevenueReport from './RevenueReport';
import TopClientsReport from './TopClientsReport';
import LatePayingClientsReport from './LatePayingClientsReport';

const reports = [
  { name: 'Revenue Report', component: <RevenueReport /> },
  { name: 'Top Clients Report', component: <TopClientsReport /> },
  { name: 'Late Paying Clients Report', component: <LatePayingClientsReport /> },
  // Add other reports here
];

const Reports = () => {
  const [activeReport, setActiveReport] = useState(reports[0]);

  return (
    <div className="flex space-x-4 mt-20">
      <div className="w-1/4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reports</h2>
        <nav className="space-y-1">
          {reports.map((report) => (
            <button
              key={report.name}
              onClick={() => setActiveReport(report)}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                activeReport.name === report.name
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {report.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="w-3/4">
        {activeReport.component}
      </div>
    </div>
  );
};

export default Reports;
