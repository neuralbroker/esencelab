'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, onFocus, onBlur, ...rest }, ref) => {
    const inputId = id || label.replace(/\s+/g, '-').toLowerCase();
    const [isFocused, setIsFocused] = useState(false);

    const controlledValue = rest.value !== undefined ? String(rest.value) : '';
    const uncontrolledValue = rest.defaultValue !== undefined ? String(rest.defaultValue) : '';
    const hasValue = controlledValue.length > 0 || uncontrolledValue.length > 0;
    const isFloating = isFocused || hasValue;

    return (
      <div className="w-full relative pt-2">
        <label
          htmlFor={inputId}
          className={`absolute left-4 transition-all duration-200 pointer-events-none
            ${isFloating ? '-top-1 text-xs px-1 bg-white/80 text-secondary z-10 rounded' : 'top-5 text-base text-secondary z-0'}`}
        >
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={`w-full rounded-xl border bg-white/68 px-4 py-3.5 text-primary text-base transition-colors focus:outline-none focus:border-[#4b4b4b] focus:ring-2 focus:ring-[#4b4b4b]/25 relative z-0
            ${error ? 'border-gray-600' : 'border-border'} ${className}`}
          {...rest}
        />
        {error && (
          <p className="mt-1.5 text-sm text-gray-600 px-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

