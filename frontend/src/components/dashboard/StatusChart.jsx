import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  draft: '#94a3b8',
  sent: '#3b82f6',
  paid: '#10b981',
  overdue: '#ef4444',
  cancelled: '#6b7280',
};

const StatusChart = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    status: item.status,
  }));

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Invoice Status Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.status]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusChart;