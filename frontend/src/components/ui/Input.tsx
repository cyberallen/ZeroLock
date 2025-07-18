import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'block w-full rounded-lg border transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];

    const variantClasses = {
      default: [
        'bg-white dark:bg-gray-800',
        'border-gray-300 dark:border-gray-600',
        'text-gray-900 dark:text-gray-100',
        'placeholder-gray-400 dark:placeholder-gray-500',
        'focus:border-primary-500 focus:ring-primary-500',
      ],
      filled: [
        'bg-gray-50 dark:bg-gray-700',
        'border-transparent',
        'text-gray-900 dark:text-gray-100',
        'placeholder-gray-400 dark:placeholder-gray-500',
        'focus:bg-white dark:focus:bg-gray-800',
        'focus:border-primary-500 focus:ring-primary-500',
      ],
    };

    const errorClasses = error
      ? [
          'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
          'text-danger-900 dark:text-danger-100',
        ]
      : [];

    const paddingClasses = [
      leftIcon && rightIcon ? 'pl-10 pr-10' : leftIcon ? 'pl-10 pr-3' : rightIcon ? 'pl-3 pr-10' : 'px-3',
      'py-2',
    ];

    const inputClasses = cn(
      baseClasses,
      variantClasses[variant],
      errorClasses,
      paddingClasses,
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className="label">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500">
                {leftIcon}
              </span>
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={inputClasses}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500">
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;