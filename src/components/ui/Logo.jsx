import React from 'react';

const Logo = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <img 
          src="/logo.png" 
          alt="Ghar Ko Swad Logo" 
          className="w-24 h-24 object-contain"
        />
      </div>
    </div>
  );
};

export default Logo;