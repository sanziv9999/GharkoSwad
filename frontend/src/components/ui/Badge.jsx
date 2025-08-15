import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  size = 'sm',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200',
    secondary: 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
    error: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    info: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return <span className={classes}>{children}</span>;
};

export default Badge;