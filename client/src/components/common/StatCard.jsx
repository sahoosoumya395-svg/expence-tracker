import React from 'react';
import { HiArrowNarrowUp, HiArrowNarrowDown } from 'react-icons/hi';

const colorStyles = {
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  red: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
};

const StatCard = ({ title, value, icon: Icon, color = 'indigo', trend }) => {
  const activeColor = colorStyles[color] || colorStyles.indigo;

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }
    if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
      return `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }
    return val;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatValue(value)}
          </h3>

          {trend && (
            <div className="flex items-center text-xs font-semibold mt-3">
              {trend.direction === 'up' || trend.isUp ? (
                <span className="flex items-center text-emerald-600">
                  <HiArrowNarrowUp className="w-4 h-4 mr-0.5" />
                  {trend.label || trend.text || trend}
                </span>
              ) : (
                <span className="flex items-center text-rose-600">
                  <HiArrowNarrowDown className="w-4 h-4 mr-0.5" />
                  {trend.label || trend.text || trend}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${activeColor.iconBg} flex items-center justify-center shrink-0`}>
            {React.isValidElement(Icon) ? Icon : <Icon className="w-6 h-6" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
