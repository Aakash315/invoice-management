import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const RevenueChart = ({ data }) => {
  // Transform data for chart
  const chartData = data.map((item) => ({
    name: `${item.month}/${item.year}`,
    revenue: item.revenue,
  }));

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Revenue Trend (Last 6 Months)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value) => `₹${value.toLocaleString()}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;