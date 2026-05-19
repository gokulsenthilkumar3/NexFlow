import React from 'react';

export const Card = ({ children, className = '' }: any) => {
  return (
    <div className={`bg-white shadow rounded-lg border border-gray-200 p-4 ${className}`}>
      {children}
    </div>
  );
};
