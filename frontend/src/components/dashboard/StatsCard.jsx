import React from 'react';
import {
  CurrencyRupeeIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const iconMap = {
  revenue: CurrencyRupeeIcon,
  invoices: DocumentTextIcon,
  clients: UsersIcon,
  pending: ClockIcon,
  profit: ArrowTrendingUpIcon,
  expenses: BanknotesIcon,
};

const getCurrencySymbol = (currency) => {
  switch (currency) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return '';
  }
};

const StatsCard = ({ title, value, icon, color = 'blue', trend, currency }) => {
  const Icon = iconMap[icon] || DocumentTextIcon;
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="card hover:shadow-lg transition-shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{currencySymbol}{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;