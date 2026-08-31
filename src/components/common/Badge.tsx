import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  className = '',
}) => {
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  const variantStyles = {
    primary: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-medium',
    secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium',
    accent: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold',
    outline: 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full transition-colors whitespace-nowrap ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
