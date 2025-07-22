import React, { useState, useEffect, useRef, useMemo } from 'react';
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

    // Aggressive cleanup before creating new routing control
    try {
      if (
        routingControlRef.current &&
        routingControlRef.current._map &&
        routingControlRef.current._container
      ) {
        routingControlRef.current.spliceWaypoints(0, 2);
        routingControlRef.current._map = null;
        routingControlRef.current._map?.removeControl(routingControlRef.current);
      }
    } catch (e) {
      // Ignore all errors
    }
    routingControlRef.current = null;

    // Create new routing control (OSRM returns shortest path by default)
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
        const route = routes[0]; // Shortest path
        const distance = (route.summary.totalDistance / 1000).toFixed(2); // km
        const time = Math.round(route.summary.totalTime / 60); // min
        onRouteFound({ distance, time, route });
      }
    }).addTo(map);

    return () => {
      try {
        if (
          routingControlRef.current &&
          routingControlRef.current._map &&
          routingControlRef.current._container
        ) {
          routingControlRef.current.spliceWaypoints(0, 2);
          routingControlRef.current._map = null;
          routingControlRef.current._map?.removeControl(routingControlRef.current);
        }
      } catch (e) {
        // Ignore all errors
      }
      routingControlRef.current = null;
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
  const [showMap, setShowMap] = useState(false);
  // Add tab state
  const [activeTab, setActiveTab] = useState('READY'); // 'READY', 'PICKED_UP', 'DELIVERED'
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const lastLocationRef = useRef(null);
  const lastRouteInfoRef = useRef(null);

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 4000);
  };

  // Load ready orders for pickup
  const loadReadyOrders = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) return;
      const result = await apiService.getReadyOrders(userData.id);
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

  // Fetch delivered orders
  const loadDeliveredOrders = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) return;
      const response = await apiService.get(`/orders/delivery/${userData.id}/status?status=DELIVERED`);
      if (response && response.data) {
        setDeliveredOrders(response.data);
      }
    } catch (error) {
      showBanner('error', `Failed to load delivered orders: ${error.message}`);
    }
  };

  // Handle location updates
  const handleLocationUpdate = async (location) => {
    const newCoords = [location.latitude, location.longitude];
    // Only update if location changed significantly (e.g., >10 meters)
    const lastCoords = lastLocationRef.current;
    const distance = lastCoords ? getDistanceBetweenCoords(lastCoords, newCoords) : Infinity;
    if (!lastCoords || distance > 0.01) { // ~10 meters in degrees
      setDeliveryLocation(newCoords);
      setMapCenter(newCoords);
      lastLocationRef.current = newCoords;
      // Debounce API call
      if (handleLocationUpdate.timeoutId) clearTimeout(handleLocationUpdate.timeoutId);
      handleLocationUpdate.timeoutId = setTimeout(async () => {
        // Double-check before sending API call: only send if coords are still different
        const latestCoords = lastLocationRef.current;
        if (!lastCoords || getDistanceBetweenCoords(latestCoords, newCoords) > 0.00001) {
          try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData && userData.id) {
              await apiService.updateDeliveryLocation(userData.id, location.latitude, location.longitude);
            }
          } catch (error) {
            console.error('Failed to update location on server:', error);
          }
        }
      }, 1000); // 1 second debounce
    }
    // If coordinates are the same, do nothing (no setState, no API call)
  };

  // Helper to calculate distance between two [lat, lng] points in degrees
  function getDistanceBetweenCoords([lat1, lng1], [lat2, lng2]) {
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  // Helper to compare coordinates
  function coordsChanged(a, b, threshold = 0.0001) {
    if (!a || !b) return true;
    const dLat = a[0] - b[0];
    const dLng = a[1] - b[1];
    return Math.sqrt(dLat * dLat + dLng * dLng) > threshold;
  }

  // Pick up order
  const handlePickupOrder = async (orderId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) {
        showBanner('error', 'User information not found');
        return;
      }
      await apiService.updateOrderStatus(orderId, 'PICKED_UP', userData.id);
      showBanner('success', `Order #${orderId} picked up successfully!`);
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
      // Find the order object
      const order = activeOrders.find(o => o.orderId === orderId);
      if (!order) {
        showBanner('error', 'Order not found');
        return;
      }
      if (order.paymentMethod === 'CASH_ON_DELIVERY' && order.paymentStatus !== 'COMPLETED') {
        await apiService.updatePaymentStatus(orderId, userData.id, 'COMPLETED');
      }
      await apiService.updateOrderStatus(orderId, 'DELIVERED', userData.id);
      showBanner('success', `Order #${orderId} delivered successfully!`);
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

  // Update routeInfo and lastRouteInfoRef only if changed
  const handleRouteFound = (info) => {
    if (!lastRouteInfoRef.current ||
        info.distance !== lastRouteInfoRef.current.distance ||
        info.time !== lastRouteInfoRef.current.time) {
      setRouteInfo(info);
      lastRouteInfoRef.current = info;
    }
  };

  useEffect(() => {
    loadReadyOrders();
    loadActiveOrders();
    loadDeliveredOrders();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      loadReadyOrders();
      loadActiveOrders();
      loadDeliveredOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Get customer location for selected order
  const customerLocation = selectedOrder ? getCustomerLocation(selectedOrder) : null;
  // Memoize RoutingControl only when locations change significantly
  const memoizedRoutingControl = useMemo(() => {
    if (deliveryLocation && customerLocation) {
      return (
        <RoutingControl
          deliveryLocation={deliveryLocation}
          customerLocation={customerLocation}
          onRouteFound={handleRouteFound}
        />
      );
    }
    return null;
  }, [
    deliveryLocation && customerLocation
      ? deliveryLocation[0].toFixed(5) + ',' + deliveryLocation[1].toFixed(5) + '-' + customerLocation[0].toFixed(5) + ',' + customerLocation[1].toFixed(5)
      : ''
  ]);

  // Tab navigation UI
  const renderTabs = () => (
    <div className="flex space-x-2 mb-6">
      {['READY', 'PICKED_UP', 'DELIVERED'].map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-6 py-2 rounded-lg font-semibold border-2 transition-all duration-200 ${
            activeTab === tab
              ? 'bg-blue-600 text-white border-blue-600 shadow'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'
          }`}
        >
          {tab === 'READY' && 'Ready for Pickup'}
          {tab === 'PICKED_UP' && 'Picked Up'}
          {tab === 'DELIVERED' && 'Delivered'}
        </button>
      ))}
    </div>
  );

  // Filtered orders for each tab
  const getTabOrders = () => {
    if (activeTab === 'READY') return readyOrders;
    if (activeTab === 'PICKED_UP') return activeOrders;
    if (activeTab === 'DELIVERED') return deliveredOrders;
    return [];
  };

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
        {renderTabs()}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders Panel */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {activeTab === 'READY' && 'Ready for Pickup'}
                  {activeTab === 'PICKED_UP' && 'Picked Up'}
                  {activeTab === 'DELIVERED' && 'Delivered'}
                </h2>
                <Button size="sm" onClick={() => {
                  loadReadyOrders();
                  loadActiveOrders();
                  loadDeliveredOrders();
                }} className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
              
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {getTabOrders().length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders</h3>
                    <p className="text-gray-600">No orders in this category.</p>
                  </div>
                ) : (
                  getTabOrders().map((order) => (
                    <Card 
                      key={order.orderId} 
                      className="p-4 cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedOrder(order)}
                      hover
                    >
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

                      <div className="flex space-x-2">
                        {activeTab === 'READY' && (
                          <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePickupOrder(order.orderId);
                            }}
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Pick Up Order
                          </Button>
                        )}
                        {activeTab === 'PICKED_UP' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setShowMap(true);
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
                          </>
                        )}
                        {activeTab === 'DELIVERED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setShowMap(true);
                            }}
                          >
                            <Route className="w-4 h-4 mr-2" />
                            Track
                          </Button>
                        )}
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
              {showMap && selectedOrder ? (
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
                    {/* Delivery person location (custom marker that updates position) */}
                    <DeliveryMarker position={deliveryLocation || lastLocationRef.current} />
                    {customerLocation && (
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
                        {memoizedRoutingControl}
                      </>
                    )}
                  </MapContainer>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-400 border border-gray-200 rounded-lg bg-gray-50">
                  <span>Click 'Navigate' or 'Track' on an order to see the delivery route.</span>
                </div>
              )}
              {/* Optionally, add a close button for the map */}
              {showMap && (
                <div className="mt-4 flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowMap(false)}>
                    Close Map
                  </Button>
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

// Add a custom DeliveryMarker component that updates position without remounting
const DeliveryMarker = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position);
    }
  }, [position, map]);
  if (!position) return null;
  return (
    <Marker position={position} icon={deliveryIcon}>
      <Popup>
        <div className="text-center">
          <strong>Your Location</strong><br/>
          📍 {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      </Popup>
    </Marker>
  );
};