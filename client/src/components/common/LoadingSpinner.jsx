import React from 'react';

const LoadingSpinner = ({ size = 'medium', fullHeight = false, text }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4',
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 ${
        fullHeight ? 'min-h-[60vh]' : ''
      }`}
    >
      <div
        className={`${spinnerSize} rounded-full border-indigo-200 border-t-indigo-600 animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && <p className="mt-4 text-sm font-medium text-gray-500">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
