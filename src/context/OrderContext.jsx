import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../api/apiService';
import { useAuth } from '../context/AuthContext';

const OrderContext = createContext(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiService.get(`/orders/user/${user.id}`, localStorage.getItem('token'));
        setOrders(result.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user?.id]);

  const createOrder = async (orderData) => {
    if (!orderData || !orderData.items) {
      throw new Error('Invalid order data: items are required');
    }

    setLoading(true);
    setError(null);
    try {
      const orderRequest = {
        userId: orderData.userId || user?.id || 'guest',
        foodItemIds: orderData.items.map(item => item.id),
        quantities: orderData.items.map(item => item.quantity),
        amount: orderData.amount,
        paymentMethod: orderData.paymentMethod,
        specialInstructions: orderData.specialInstructions || '',
        deliveryLocation: orderData.deliveryLocation || user?.address || 'Not specified',
        deliveryPhone: orderData.deliveryPhone || user?.phone || '',
        deliveryCoordinates: orderData.deliveryCoordinates || '[27.7172, 85.3240]',
        transactionUuid: orderData.transactionUuid || null,
      };
      console.log('Order request being sent:', orderRequest);
      const response = await apiService.post('/orders/place', orderRequest, localStorage.getItem('token'));
      const order = response.data;
      setOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
      return order;
    } catch (err) {
      setError(err.message || 'Failed to place order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyEsewaPayment = async (transactionUuid, amount) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.verifyEsewaPayment(transactionUuid, amount);
      if (response.status === 'success') {
        // Update the local orders state with the verified order
        const updatedOrder = response.data;
        setOrders(prev => prev.map(order =>
          order.id === updatedOrder.id ? updatedOrder : order
        ));
      }
      return response;
    } catch (err) {
      setError(err.message || 'Failed to verify payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = (orderId, status, additionalData = {}) => {
    if (!['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'].includes(status)) {
      throw new Error('Invalid order status');
    }

    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status, ...additionalData, updatedAt: new Date().toISOString() }
          : order
      )
    );
  };

  const getOrdersByUser = (userId) => {
    return orders.filter(order => order.userId === userId);
  };

  const getOrdersByDriver = (driverId) => {
    return orders.filter(order => order.deliveryInfo?.driverId === driverId);
  };

  const getActiveOrders = () => {
    return orders.filter(order =>
      ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'].includes(order.status)
    );
  };

  const value = {
    orders,
    createOrder,
    verifyEsewaPayment,
    updateOrderStatus,
    getOrdersByUser,
    getOrdersByDriver,
    getActiveOrders,
    loading,
    error,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};