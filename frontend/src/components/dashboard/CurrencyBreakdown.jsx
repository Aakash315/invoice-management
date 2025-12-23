import React from 'react';

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

const CurrencyBreakdown = ({ data, baseCurrency }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Revenue by Currency
      </h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.currency} className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-900 mr-2">
                {getCurrencySymbol(item.currency)}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.currency}
                </p>
                <p className="text-xs text-gray-500">
                  {item.count} invoices
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {getCurrencySymbol(item.currency)}{item.total_amount.toLocaleString()}
              </p>
              {item.currency !== baseCurrency && (
                <p className="text-xs text-gray-500">
                  ({getCurrencySymbol(baseCurrency)}{item.converted_amount.toLocaleString()})
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyBreakdown;
