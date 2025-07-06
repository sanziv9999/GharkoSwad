import React, { createContext, useContext, useState } from 'react';

// Create the Order Context
const OrderContext = createContext(undefined);

// Custom hook to use the Order context
export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

// Order Provider component
export const OrderProvider = ({ children }) => {
  const currentDate = new Date('2025-06-27T07:21:00+05:45'); // Current time: 07:21 AM IST, June 27, 2025

  const [orders, setOrders] = useState([
    {
      id: 'ORD-001',
      userId: '1',
      items: [
        {
          id: 1,
          name: 'Traditional Dal Bhat',
          price: 180,
          quantity: 2,
          chef: 'Ama Didi Kitchen',
          image: 'http://localhost:8080/uploads/images/dal-bhat.jpg' // Example image path
        }
      ],
      total: 360,
      status: 'preparing',
      customerInfo: {
        name: 'John Doe',
        phone: '+977-9841234567',
        address: 'Thamel, Kathmandu',
        coordinates: [27.7172, 85.3240]
      },
      deliveryInfo: {
        driverId: 'DRV-001',
        driverName: 'Ram Bahadur',
        driverPhone: '+977-9841234568',
        estimatedTime: '25-30 min',
        currentLocation: [27.7100, 85.3200]
      },
      createdAt: currentDate.toISOString(),
      updatedAt: currentDate.toISOString()
    }
  ]);

  const createOrder = (orderData) => {
    if (!orderData || !orderData.items || !orderData.customerInfo) {
      throw new Error('Invalid order data: items and customerInfo are required');
    }

    const newOrder = {
      id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Unique ID with random suffix
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Ensure items have necessary fields
    newOrder.items = orderData.items.map(item => ({
      ...item,
      image: item.imagePath ? imagePathService.getImageUrl(item.imagePath) : item.image || '' // Fallback image handling
    }));

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId, status, additionalData = {}) => {
    if (!['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'].includes(status)) {
      throw new Error('Invalid order status');
    }

    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? {
              ...order,
              status,
              ...additionalData,
              updatedAt: new Date().toISOString()
            }
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
    updateOrderStatus,
    getOrdersByUser,
    getOrdersByDriver,
    getActiveOrders
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};