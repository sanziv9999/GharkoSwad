import React, { createContext, useContext, useState } from 'react';

const OrderContext = createContext(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
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
          chef: 'Ama Didi Kitchen'
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  const createOrder = (orderData) => {
    const newOrder = {
      id: `ORD-${Date.now()}`,
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId, status, additionalData = {}) => {
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