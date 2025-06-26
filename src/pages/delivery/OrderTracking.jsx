import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Phone, Clock, MapPin, CheckCircle, Package, Truck, Home } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OrderTracking = () => {
  const { orderId } = useParams();
  const { orders, updateOrderStatus } = useOrders();
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState([27.7100, 85.3200]);

  useEffect(() => {
    const foundOrder = orders.find(o => o.id === orderId);
    setOrder(foundOrder);
  }, [orderId, orders]);

  // Simulate driver movement
  useEffect(() => {
    if (!order || order.status === 'delivered') return;

    const interval = setInterval(() => {
      setDriverLocation(prev => {
        const targetLat = order.customerInfo.coordinates[0];
        const targetLng = order.customerInfo.coordinates[1];
        const currentLat = prev[0];
        const currentLng = prev[1];
        
        // Move driver closer to destination
        const latDiff = (targetLat - currentLat) * 0.1;
        const lngDiff = (targetLng - currentLng) * 0.1;
        
        return [currentLat + latDiff, currentLng + lngDiff];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [order]);

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Order Placed', color: 'warning', icon: Package },
      confirmed: { label: 'Confirmed', color: 'primary', icon: CheckCircle },
      preparing: { label: 'Preparing', color: 'warning', icon: Package },
      ready: { label: 'Ready for Pickup', color: 'success', icon: CheckCircle },
      picked_up: { label: 'Out for Delivery', color: 'primary', icon: Truck },
      delivered: { label: 'Delivered', color: 'success', icon: Home }
    };
    return statusMap[status] || statusMap.pending;
  };

  const orderSteps = [
    { key: 'pending', label: 'Order Placed', time: '2 min ago' },
    { key: 'confirmed', label: 'Order Confirmed', time: '1 min ago' },
    { key: 'preparing', label: 'Preparing Food', time: 'Now' },
    { key: 'ready', label: 'Ready for Pickup', time: '' },
    { key: 'picked_up', label: 'Out for Delivery', time: '' },
    { key: 'delivered', label: 'Delivered', time: '' }
  ];

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-600">Please check your order ID and try again.</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
              <p className="text-gray-600 mt-1">Order ID: {order.id}</p>
            </div>
            <Badge variant={statusInfo.color} className="flex items-center space-x-2 px-4 py-2">
              <StatusIcon className="w-4 h-4" />
              <span>{statusInfo.label}</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-96">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Live Tracking</h2>
              <div className="h-80 rounded-lg overflow-hidden">
                <MapContainer
                  center={[27.7172, 85.3240]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Customer Location */}
                  <Marker position={order.customerInfo.coordinates}>
                    <Popup>
                      <div className="text-center">
                        <Home className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                        <p className="font-semibold">Delivery Address</p>
                        <p className="text-sm">{order.customerInfo.address}</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Driver Location */}
                  {order.status !== 'delivered' && (
                    <Marker position={driverLocation}>
                      <Popup>
                        <div className="text-center">
                          <Truck className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                          <p className="font-semibold">{order.deliveryInfo?.driverName}</p>
                          <p className="text-sm">Delivery Partner</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Route Line */}
                  {order.status !== 'delivered' && (
                    <Polyline
                      positions={[driverLocation, order.customerInfo.coordinates]}
                      color="blue"
                      weight={3}
                      opacity={0.7}
                    />
                  )}
                </MapContainer>
              </div>
            </Card>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status</h2>
              <div className="space-y-4">
                {orderSteps.map((step, index) => {
                  const isCompleted = orderSteps.findIndex(s => s.key === order.status) >= index;
                  const isCurrent = step.key === order.status;
                  
                  return (
                    <div key={step.key} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-primary-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </p>
                        {step.time && (
                          <p className="text-sm text-gray-500">{step.time}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Delivery Info */}
            {order.deliveryInfo && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Partner</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{order.deliveryInfo.driverName}</p>
                    <p className="text-sm text-gray-600">Delivery Partner</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Call Driver</span>
                </Button>
              </Card>
            )}

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{order.total}</span>
                </div>
              </div>
            </Card>

            {/* Estimated Time */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-primary-500" />
                <span className="font-semibold text-gray-900">Estimated Delivery</span>
              </div>
              <p className="text-2xl font-bold text-primary-600">
                {order.status === 'delivered' ? 'Delivered!' : '15-20 min'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {order.status === 'delivered' 
                  ? 'Thank you for your order!' 
                  : 'Your food will arrive soon'
                }
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;