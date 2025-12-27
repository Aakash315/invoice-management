import React from 'react';

export const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  required = false,
  ...props
}) => {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${className}`}
      {...props}
    />
  );
};
