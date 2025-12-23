import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RevenueReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    group_by: 'month',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await reportService.getRevenueReport(filters);
        setData(result);
      } catch (err) {
        setError('Failed to fetch revenue report');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const chartData = {
    labels: data.map(item => {
      if (filters.group_by === 'day') {
        return `${item.day}/${item.month}/${item.year}`;
      }
      if (filters.group_by === 'month') {
        return `${item.month}/${item.year}`;
      }
      return item.year;
    }),
    datasets: [
      {
        label: 'Total Revenue',
        data: data.map(item => item.total_revenue),
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Report</h2>
      <div className="flex space-x-4 mb-4">
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          className="input-field"
        />
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          className="input-field"
        />
        <select
          value={filters.group_by}
          onChange={(e) => setFilters({ ...filters, group_by: e.target.value })}
          className="input-field"
        >
          <option value="day">Day</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <Line data={chartData} />}
    </div>
  );
};

export default RevenueReport;
