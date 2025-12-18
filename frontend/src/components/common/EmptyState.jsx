import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="h-16 w-16 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary inline-flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;