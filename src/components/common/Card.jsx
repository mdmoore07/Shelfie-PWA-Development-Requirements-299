import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'sm',
  hover = false,
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const classes = `
    bg-white rounded-lg border border-gray-200
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${hover ? 'hover:shadow-md transition-shadow' : ''}
    ${className}
  `.trim();
  
  const CardComponent = hover ? motion.div : 'div';
  
  return (
    <CardComponent
      className={classes}
      whileHover={hover ? { y: -2 } : undefined}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

export default Card;