import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Package, Clock, Phone, MapPin, CheckCircle, Truck, Navigation } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Banner from '../../components/ui/Banner';
import 'leaflet/dist/leaflet.css';

const DeliveryDashboard = () => {
  const { orders, updateOrderStatus } = useOrders();
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState([27.7100, 85.3200]);

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 4000);
  };

  // Get orders assigned to current driver
  const driverOrders = orders.filter(order => 
    order.deliveryInfo?.driverId === 'DRV-001' && 
    ['confirmed', 'preparing', 'ready', 'picked_up'].includes(order.status)
  );

  const handleStatusUpdate = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    
    const statusMessages = {
      picked_up: 'Order picked up successfully!',
      delivered: 'Order delivered successfully!'
    };
    
    showBanner('success', statusMessages[newStatus] || 'Status updated successfully!');
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'warning',
      preparing: 'warning',
      ready: 'success',
      picked_up: 'primary',
      delivered: 'success'
    };
    return colors[status] || 'primary';
  };

  const getNextAction = (status) => {
    const actions = {
      ready: { action: 'picked_up', label: 'Pick Up Order', icon: Package },
      picked_up: { action: 'delivered', label: 'Mark as Delivered', icon: CheckCircle }
    };
    return actions[status];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {banner.show && (
        <Banner 
          type={banner.type} 
          message={banner.message} 
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Delivery Dashboard 🚚
              </h1>
              <p className="text-gray-600 mt-1">Manage your delivery orders</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="success" className="px-4 py-2">
                🟢 Online
              </Badge>
              <Badge variant="primary" className="px-4 py-2">
                {driverOrders.length} Active Orders
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active Deliveries</h2>
              <div className="space-y-4">
                {driverOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No active deliveries</h3>
                    <p className="text-gray-600">New orders will appear here</p>
                  </div>
                ) : (
                  driverOrders.map((order) => {
                    const nextAction = getNextAction(order.status);
                    
                    return (
                      <Card 
                        key={order.id} 
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          selectedOrder?.id === order.id ? 'ring-2 ring-primary-500' : ''
                        }`}
                        onClick={() => setSelectedOrder(order)}
                        hover
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900">{order.id}</h3>
                            <p className="text-sm text-gray-600">{order.customerInfo.name}</p>
                          </div>
                          <Badge variant={getStatusColor(order.status)} size="sm">
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{order.customerInfo.address}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>₹{order.total} • {order.items.length} items</span>
                          </div>
                        </div>

                        {nextAction && (
                          <Button
                            size="sm"
                            className="w-full flex items-center justify-center space-x-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(order.id, nextAction.action);
                            }}
                          >
                            <nextAction.icon className="w-4 h-4" />
                            <span>{nextAction.label}</span>
                          </Button>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Map and Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Map</h2>
              <div className="h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={[27.7172, 85.3240]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Driver Location */}
                  <Marker position={driverLocation}>
                    <Popup>
                      <div className="text-center">
                        <Truck className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <p className="font-semibold">Your Location</p>
                        <p className="text-sm">Delivery Partner</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Customer Locations */}
                  {driverOrders.map((order) => (
                    <Marker key={order.id} position={order.customerInfo.coordinates}>
                      <Popup>
                        <div className="text-center">
                          <Package className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                          <p className="font-semibold">{order.customerInfo.name}</p>
                          <p className="text-sm">{order.customerInfo.address}</p>
                          <p className="text-sm font-medium">₹{order.total}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </Card>

            {/* Selected Order Details */}
            {selectedOrder && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                  <Badge variant={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Name:</span>
                        <span>{selectedOrder.customerInfo.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedOrder.customerInfo.phone}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <span>{selectedOrder.customerInfo.address}</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4 flex items-center justify-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Call Customer</span>
                    </Button>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.name} x{item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>₹{selectedOrder.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 mt-6">
                  <Button variant="outline" className="flex-1 flex items-center justify-center space-x-2">
                    <Navigation className="w-4 h-4" />
                    <span>Get Directions</span>
                  </Button>
                  {getNextAction(selectedOrder.status) && (() => {
                    const nextAction = getNextAction(selectedOrder.status);
                    const IconComponent = nextAction.icon;
                    return (
                      <Button 
                        className="flex-1 flex items-center justify-center space-x-2"
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, nextAction.action);
                        }}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{nextAction.label}</span>
                      </Button>
                    );
                  })()}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;