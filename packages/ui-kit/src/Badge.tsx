import React from 'react';

export const Badge = ({ children, className = '' }: any) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
};
