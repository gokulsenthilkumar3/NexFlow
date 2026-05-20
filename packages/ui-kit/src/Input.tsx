import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`rounded-md border px-3 py-2 text-sm outline-none transition-colors
            ${
              error
                ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
            }
            dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
            disabled:cursor-not-allowed disabled:opacity-50
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
