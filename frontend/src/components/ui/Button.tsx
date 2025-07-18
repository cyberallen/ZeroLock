import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center font-medium rounded-lg',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];

    const variantClasses = {
      primary: [
        'bg-primary-600 hover:bg-primary-700 text-white',
        'focus:ring-primary-500',
        'shadow-sm hover:shadow-md',
      ],
      secondary: [
        'bg-gray-200 hover:bg-gray-300 text-gray-900',
        'dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100',
        'focus:ring-gray-500',
        'shadow-sm hover:shadow-md',
      ],
      success: [
        'bg-success-600 hover:bg-success-700 text-white',
        'focus:ring-success-500',
        'shadow-sm hover:shadow-md',
      ],
      danger: [
        'bg-danger-600 hover:bg-danger-700 text-white',
        'focus:ring-danger-500',
        'shadow-sm hover:shadow-md',
      ],
      outline: [
        'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
        'dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20',
        'focus:ring-primary-500',
      ],
      ghost: [
        'text-gray-700 hover:bg-gray-100',
        'dark:text-gray-300 dark:hover:bg-gray-800',
        'focus:ring-gray-500',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;