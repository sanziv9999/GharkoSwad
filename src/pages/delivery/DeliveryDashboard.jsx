import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

// Add basic styles for routing control
const routingStyles = `
  .leaflet-routing-container {
    display: none !important;
  }
  .leaflet-routing-alt {
    display: none !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = routingStyles;
  document.head.appendChild(style);
}
import { Package, Clock, Phone, MapPin, CheckCircle, Truck, Navigation, User, LogOut, RefreshCw, Route } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Banner from '../../components/ui/Banner';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Routing component
const RoutingControl = ({ deliveryLocation, customerLocation, onRouteFound }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!deliveryLocation || !customerLocation) return;

    // Remove existing routing control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Create new routing control
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(deliveryLocation[0], deliveryLocation[1]),
        L.latLng(customerLocation[0], customerLocation[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      createMarker: () => null, // Don't create default markers
      lineOptions: {
        styles: [
          { color: '#3B82F6', weight: 6, opacity: 0.8 }
        ]
      },
      show: false, // Hide the directions panel
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      })
    }).on('routesfound', function(e) {
      const routes = e.routes;
      if (routes.length > 0) {
        const route = routes[0];
        const distance = (route.summary.totalDistance / 1000).toFixed(2); // Convert to km
        const time = Math.round(route.summary.totalTime / 60); // Convert to minutes
        onRouteFound({ distance, time, route });
      }
    }).addTo(map);

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, deliveryLocation, customerLocation, onRouteFound]);

  return null;
};

// Live location tracking component
const LocationTracker = ({ onLocationUpdate, isTracking }) => {
  useEffect(() => {
    let watchId;

    if (isTracking && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          onLocationUpdate({ latitude, longitude, accuracy });
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, onLocationUpdate]);

  return null;
};

const DeliveryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [readyOrders, setReadyOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]); // Kathmandu center

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 4000);
  };

  // Load ready orders for pickup
  const loadReadyOrders = async () => {
    try {
      const result = await apiService.getReadyOrders();
      if (result && result.data) {
        setReadyOrders(result.data);
      }
    } catch (error) {
      showBanner('error', `Failed to load ready orders: ${error.message}`);
    }
  };

  // Load active delivery orders
  const loadActiveOrders = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData && userData.id) {
        const result = await apiService.getDeliveryOrders(userData.id);
        if (result && result.data) {
          setActiveOrders(result.data);
        }
      }
    } catch (error) {
      console.log('No active delivery orders found');
    }
  };

  // Handle location updates
  const handleLocationUpdate = async (location) => {
    setDeliveryLocation([location.latitude, location.longitude]);
    setMapCenter([location.latitude, location.longitude]);
    
    // Update location on server
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData && userData.id) {
        await apiService.updateDeliveryLocation(userData.id, location.latitude, location.longitude);
      }
    } catch (error) {
      console.error('Failed to update location on server:', error);
    }
  };

  // Pick up order
  const handlePickupOrder = async (orderId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) {
        showBanner('error', 'User information not found');
        return;
      }

      // Assign order to delivery person and update status to PICKED_UP
      await apiService.assignOrderToDelivery(orderId, userData.id);
      await apiService.updateOrderStatus(orderId, 'PICKED_UP', userData.id);
      
      showBanner('success', `Order #${orderId} picked up successfully!`);
      
      // Refresh orders
      loadReadyOrders();
      loadActiveOrders();
    } catch (error) {
      showBanner('error', `Failed to pickup order: ${error.message}`);
    }
  };

  // Mark as delivered
  const handleMarkDelivered = async (orderId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) {
        showBanner('error', 'User information not found');
        return;
      }

      await apiService.updateOrderStatus(orderId, 'DELIVERED', userData.id);
      showBanner('success', `Order #${orderId} delivered successfully!`);
      
      // Refresh orders
      loadActiveOrders();
      setSelectedOrder(null);
    } catch (error) {
      showBanner('error', `Failed to mark as delivered: ${error.message}`);
    }
  };

  // Parse coordinates from string
  const parseCoordinates = (coordString) => {
    try {
      if (typeof coordString === 'string') {
        const coords = JSON.parse(coordString);
        if (Array.isArray(coords) && coords.length === 2) {
          return [parseFloat(coords[0]), parseFloat(coords[1])];
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // Get customer location from order
  const getCustomerLocation = (order) => {
    return parseCoordinates(order.deliveryCoordinates);
  };

  // Toggle location tracking
  const toggleLocationTracking = () => {
    setIsLocationTracking(!isLocationTracking);
    showBanner('info', isLocationTracking ? 'Location tracking stopped' : 'Location tracking started');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'READY': return 'bg-green-100 text-green-800';
      case 'PICKED_UP': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    loadReadyOrders();
    loadActiveOrders();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      loadReadyOrders();
      loadActiveOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Location Tracker */}
      <LocationTracker onLocationUpdate={handleLocationUpdate} isTracking={isLocationTracking} />
      
      {banner.show && (
        <Banner 
          type={banner.type} 
          message={banner.message} 
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard 🚚</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.username}! Manage your deliveries</p>
              {deliveryLocation && (
                <p className="text-xs text-green-600 mt-1">
                  📍 GPS Active: {deliveryLocation[0].toFixed(6)}, {deliveryLocation[1].toFixed(6)}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button
                size="sm"
                variant={isLocationTracking ? "primary" : "outline"}
                onClick={toggleLocationTracking}
                className="flex items-center space-x-2"
              >
                <Navigation className="w-4 h-4" />
                <span>{isLocationTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
              </Button>
              <Badge variant="success" className="px-3 py-1">
                {isLocationTracking ? '🟢 Tracking' : '🔴 Offline'}
              </Badge>
              <Badge variant="primary" className="px-3 py-1">
                {activeOrders.length} Active
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders Panel */}
          <div className="space-y-6">
            {/* Ready Orders for Pickup */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Ready for Pickup</h2>
                <Button size="sm" onClick={loadReadyOrders} className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
              
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {readyOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No ready orders</h3>
                    <p className="text-gray-600">Orders ready for pickup will appear here</p>
                  </div>
                ) : (
                  readyOrders.map((order) => (
                    <Card key={order.orderId} className="p-4 border border-green-200 bg-green-50" hover>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">Order #{order.orderId}</h3>
                          <p className="text-sm text-gray-600">Customer ID: {order.userId}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.orderDate)}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)} size="sm">
                          {order.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{order.deliveryLocation}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{order.deliveryPhone}</span>
                        </div>
                        {order.amount && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Package className="w-4 h-4" />
                            <span>₹{order.amount} • {order.orderItems?.length || 0} items</span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handlePickupOrder(order.orderId)}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Pick Up Order
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </Card>

            {/* Active Deliveries */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Active Deliveries</h2>
                <Badge variant="primary" className="px-3 py-1">
                  {activeOrders.length} Active
                </Badge>
              </div>
              
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No active deliveries</h3>
                    <p className="text-gray-600">Pick up orders to start deliveries</p>
                  </div>
                ) : (
                  activeOrders.map((order) => (
                    <Card 
                      key={order.orderId} 
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        selectedOrder?.orderId === order.orderId ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedOrder(order)}
                      hover
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">Order #{order.orderId}</h3>
                          <p className="text-sm text-gray-600">Customer ID: {order.userId}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)} size="sm">
                          {order.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{order.deliveryLocation}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{order.deliveryPhone}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                        >
                          <Route className="w-4 h-4 mr-2" />
                          Navigate
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkDelivered(order.orderId);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Delivered
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Map Panel */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Live Tracking Map</h2>
                {routeInfo && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Distance:</span> {routeInfo.distance} km • 
                    <span className="font-medium ml-2">ETA:</span> {routeInfo.time} min
                  </div>
                )}
              </div>
              
              <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Delivery person location */}
                  {deliveryLocation && (
                    <Marker position={deliveryLocation} icon={deliveryIcon}>
                      <Popup>
                        <div className="text-center">
                          <strong>Your Location</strong><br/>
                          📍 {deliveryLocation[0].toFixed(6)}, {deliveryLocation[1].toFixed(6)}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Customer location and routing */}
                  {selectedOrder && (() => {
                    const customerLocation = getCustomerLocation(selectedOrder);
                    return customerLocation ? (
                      <>
                        <Marker position={customerLocation} icon={customerIcon}>
                          <Popup>
                            <div className="text-center">
                              <strong>Customer Location</strong><br/>
                              📍 Order #{selectedOrder.orderId}<br/>
                              📞 {selectedOrder.deliveryPhone}<br/>
                              🏠 {selectedOrder.deliveryLocation}
                            </div>
                          </Popup>
                        </Marker>
                        {deliveryLocation && (
                          <RoutingControl
                            deliveryLocation={deliveryLocation}
                            customerLocation={customerLocation}
                            onRouteFound={setRouteInfo}
                          />
                        )}
                      </>
                    ) : null;
                  })()}
                </MapContainer>
              </div>
              
              {selectedOrder && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Navigation to Order #{selectedOrder.orderId}
                  </h3>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>📍 Destination: {selectedOrder.deliveryLocation}</p>
                    <p>📞 Contact: {selectedOrder.deliveryPhone}</p>
                    {routeInfo && (
                      <>
                        <p>🛣️ Distance: {routeInfo.distance} km</p>
                        <p>⏱️ Estimated Time: {routeInfo.time} minutes</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {!deliveryLocation && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg text-center">
                  <p className="text-orange-800">
                    📍 Enable location tracking to see navigation routes
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;