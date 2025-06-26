import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const CartIcon = ({ onClick, className = '' }) => {
  const { getTotalItems } = useCart();
  const itemCount = getTotalItems();

  return (
    <button 
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200 ${className}`}
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartIcon;