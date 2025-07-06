import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../api/apiService';
import imagePathService from '../services/imageLocation/imagePath';

const CartContext = createContext(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  // Fetch cart items from API on mount
  useEffect(() => {
    const fetchCartItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = localStorage.getItem('userId'); // Assume userId is stored after login
        if (!userId) throw new Error('User not authenticated');
        const result = await apiService.getCartItems(userId, token);
        setCartItems(result || []);
      } catch (err) {
        setError(err.message || 'Failed to load cart');
        console.error('Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCartItems();
  }, [token]);

  // Sync cart with API on changes
  const syncCartWithAPI = async (newCartItems) => {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User not authenticated');
      // For simplicity, we'll just fetch the latest state after each operation
      const result = await apiService.getCartItems(userId, token);
      setCartItems(result || []);
    } catch (err) {
      setError(err.message || 'Failed to sync cart');
      console.error('Error syncing cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item, quantity = 1) => {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User not authenticated');
      const itemWithImage = {
        ...item,
        imageUrl: item.imagePath ? imagePathService.getImageUrl(item.imagePath) : 
                  item.image ? imagePathService.getImageUrl(item.image) : null,
        quantity,
      };
      await apiService.addToCart(userId, item.id, quantity, token);
      await syncCartWithAPI();
    } catch (err) {
      setError(err.message || 'Failed to add item to cart');
      console.error('Error adding to cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw newError('User not authenticated');
      await apiService.deleteCartItem(userId, itemId, token);
      await syncCartWithAPI();
    } catch (err) {
      setError(err.message || 'Failed to remove item from cart');
      console.error('Error removing from cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User not authenticated');
      if (quantity > cartItems.find(item => item.id === itemId)?.quantity) {
        await apiService.increaseCartQuantity(userId, itemId, token);
      } else {
        await apiService.decreaseCartQuantity(userId, itemId, token);
      }
      await syncCartWithAPI();
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
      console.error('Error updating quantity:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User not authenticated');
      await apiService.clearCart(userId, token);
      setCartItems([]);
    } catch (err) {
      setError(err.message || 'Failed to clear cart');
      console.error('Error clearing cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isCartOpen,
    setIsCartOpen,
    loading,
    error,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};