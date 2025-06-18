import React from 'react';
import { Flame } from 'lucide-react';

const Logo = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <Flame className="w-8 h-8 text-primary-500" />
      </div>
      <div className="text-xl font-bold">
        <span className="text-gray-800">Oyster to </span>
        <span className="text-primary-500">Guest</span>
      </div>
    </div>
  );
};

export default Logo;