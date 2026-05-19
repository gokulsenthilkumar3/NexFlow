import React from 'react';

export const Button = ({ children, className = '', ...props }: any) => {
  return (
    <button 
      className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
