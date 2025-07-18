import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center font-medium rounded-full',
      'transition-colors duration-200',
    ];

    const variantClasses = {
      default: [
        'bg-gray-100 text-gray-800',
        'dark:bg-gray-800 dark:text-gray-200',
      ],
      primary: [
        'bg-primary-100 text-primary-800',
        'dark:bg-primary-900 dark:text-primary-200',
      ],
      success: [
        'bg-success-100 text-success-800',
        'dark:bg-success-900 dark:text-success-200',
      ],
      warning: [
        'bg-warning-100 text-warning-800',
        'dark:bg-warning-900 dark:text-warning-200',
      ],
      danger: [
        'bg-danger-100 text-danger-800',
        'dark:bg-danger-900 dark:text-danger-200',
      ],
      outline: [
        'border border-gray-300 text-gray-700',
        'dark:border-gray-600 dark:text-gray-300',
      ],
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;