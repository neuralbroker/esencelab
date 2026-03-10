'use client';

/**
 * Shared select component.
 *
 * This keeps dropdown styling and label placement aligned with the rest of the
 * form system used throughout the app.
 */
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, id, onFocus, onBlur, ...rest }, ref) => {
    const inputId = id || label.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="w-full relative pt-2">
        <label
          htmlFor={inputId}
          className="absolute left-4 transition-all duration-200 pointer-events-none text-xs px-1 bg-white/80 text-secondary z-10 -top-1 rounded"
        >
          {label}
        </label>
        <select
          id={inputId}
          ref={ref}
          onFocus={(e) => {
            onFocus?.(e);
          }}
          onBlur={(e) => {
            onBlur?.(e);
          }}
          className={`w-full rounded-xl border bg-white/68 px-4 py-3.5 text-primary text-base transition-colors focus:outline-none focus:border-[#4b4b4b] focus:ring-2 focus:ring-[#4b4b4b]/25 relative z-0 appearance-none
            ${error ? 'border-gray-600' : 'border-border'} ${className}`}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-white text-primary">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none mt-1">
          <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-gray-600 px-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;

