import React from 'react';

export const Table = ({ children, className = '' }: any) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-300 ${className}`}>
        {children}
      </table>
    </div>
  );
};
