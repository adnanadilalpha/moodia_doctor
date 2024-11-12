import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}) => {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors duration-200';
  
  const variantStyles = {
    default: 'bg-blue-500 text-white hover:bg-blue-600',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <button 
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  );
}; 