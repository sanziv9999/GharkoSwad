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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiService.getCartItems(userId, token);
        setCartItems(result || []);
      } catch (err) {
        setError(err.message || 'Failed to load cart');
      } finally {
        setLoading(false);
      }
    };
    fetchCartItems();
  }, [userId, token]);

  const syncCartWithAPI = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getCartItems(userId, token);
      setCartItems(result || []);
    } catch (err) {
      setError(err.message || 'Failed to sync cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item, quantity = 1) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const itemWithImage = {
        ...item,
        imageUrl: item.imagePath ? imagePathService.getImageUrl(item.imagePath) : 
                  item.image ? imagePathService.getImageUrl(item.image) : null,
        quantity,
      };
      console.log('Adding item with foodId:', item.id); // Log the foodId being passed
      const response = await apiService.addToCart(userId, item.id, quantity, token);
      if (response.status === 'success') {
        await syncCartWithAPI();
      } else {
        throw new Error(response.message || 'Failed to add item');
      }
    } catch (err) {
      setError(err.message || 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (foodId) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiService.deleteCartItem(userId, foodId, token);
      await syncCartWithAPI();
    } catch (err) {
      setError(err.message || 'Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (foodId, quantity) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    if (quantity <= 0) {
      await removeFromCart(foodId);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const currentItem = cartItems.find(item => item.foodId === foodId);
      if (quantity > (currentItem?.quantity || 0)) {
        await apiService.increaseCartQuantity(userId, foodId, token);
      } else {
        await apiService.decreaseCartQuantity(userId, foodId, token);
      }
      await syncCartWithAPI();
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('Clearing cart for user:', userId);
      await apiService.clearCart(userId, token);
      setCartItems([]);
      console.log('Cart cleared successfully');
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setError(err.message || 'Failed to clear cart');
      throw err; // Re-throw to allow calling code to handle
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
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