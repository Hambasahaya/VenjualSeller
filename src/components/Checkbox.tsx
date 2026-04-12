'use client';

import React from 'react';

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Checkbox({
  label,
  error,
  ...props
}: CheckboxProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          {...props}
        />
        {label && (
          <label className="text-sm text-gray-700 cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
