import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
