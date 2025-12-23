import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const RecurringBadge = ({ 
  template, 
  generatedDate, 
  showTemplateLink = true,
  size = 'sm',
  onClick,
  className = '' 
}) => {
  if (!template && !generatedDate) return null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const formatFrequency = (template) => {
    if (!template) return '';
    const { frequency, interval_value, day_of_week, day_of_month } = template;
    
    if (interval_value === 1) {
      return frequency.charAt(0).toUpperCase() + frequency.slice(1);
    } else {
      let display = `Every ${interval_value} ${frequency}`;
      if (interval_value > 1) display += 's';
      
      if (frequency === 'weekly' && day_of_week !== null) {
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        display += ` (${dayNames[day_of_week]})`;
      } else if (frequency === 'monthly' && day_of_month !== null) {
        display += ` (Day ${day_of_month})`;
      }
      
      return display;
    }
  };

  const badgeContent = (
    <span 
      className={`
        inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200
        ${sizeClasses[size]} 
        ${className}
      `}
      onClick={onClick}
    >
      <ArrowPathIcon className={`${iconSizes[size]} mr-1 flex-shrink-0`} />
      <div className="flex flex-col">
        <span className="font-medium">
          {template ? template.template_name : 'Recurring'}
        </span>
        {template && (
          <span className="text-blue-600 opacity-75 text-xs">
            {formatFrequency(template)}
          </span>
        )}
        {generatedDate && (
          <span className="text-blue-600 opacity-75 text-xs">
            Generated {format(new Date(generatedDate), 'MMM dd')}
          </span>
        )}
      </div>
    </span>
  );

  if (showTemplateLink && template) {
    return (
      <Link 
        to={`/recurring-invoices/view/${template.id}`}
        className="hover:opacity-80 transition-opacity"
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {badgeContent}
      </Link>
    );
  }

  return badgeContent;
};

export default RecurringBadge;
