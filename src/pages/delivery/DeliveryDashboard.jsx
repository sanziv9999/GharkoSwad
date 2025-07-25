import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Package, Clock, Phone, MapPin, CheckCircle, Truck, Navigation, User, LogOut, RefreshCw, Route } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Banner from '../../components/ui/Banner';
import imagePathService from '../../services/imageLocation/imagePath';

// Add basic styles for routing control and map controls
const routingStyles = `
  .leaflet-routing-container {
    display: none !important;
  }
  .leaflet-routing-alt {
    display: none !important;
  }
  .map-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .map-control-btn {
    background: white;
    border: 2px solid #ccc;
    border-radius: 4px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .map-control-btn:hover {
    background: #f0f0f0;
    border-color: #3B82F6;
  }
  .map-container-rotated {
    transition: transform 0.3s ease;
  }
  .compass-indicator {
    position: absolute;
    top: 50px;
    right: 10px;
    z-index: 1000;
    background: white;
    border: 2px solid #ccc;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  .auto-focus-active {
    background: #3B82F6 !important;
    color: white !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = routingStyles;
  document.head.appendChild(style);
}

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom delivery truck icon (non-transparent)
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  shadowSize: [41, 41]
});

// Alternative delivery van icon (non-transparent)
// const deliveryIcon = new L.Icon({
//   iconUrl: 'https://cdn-icons-png.flaticon.com/512/1005/1005141.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
//   iconSize: [40, 40],
//   iconAnchor: [20, 20],
//   popupAnchor: [0, -20],
//   shadowSize: [41, 41]
// });

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map Auto-Focus Component
const MapAutoFocus = ({ deliveryLocation, customerLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (deliveryLocation && customerLocation) {
      // Create bounds that include both locations
      const bounds = L.latLngBounds([deliveryLocation, customerLocation]);
      // Fit map to show both points with padding
      map.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 15 
      });
    } else if (deliveryLocation) {
      // If only delivery location, center on it
      map.setView(deliveryLocation, 14);
    }
  }, [map, deliveryLocation, customerLocation]);

  return null;
};

// Map Controls Component
const MapControls = ({ onRotateLeft, onRotateRight, onResetRotation, onFocusDelivery, onAutoFocus, autoFocusEnabled }) => {
  return (
    <>
      <div className="map-controls">
        <button className="map-control-btn" onClick={onRotateLeft} title="Rotate Left">
          ↺
        </button>
        <button className="map-control-btn" onClick={onRotateRight} title="Rotate Right">
          ↻
        </button>
        <button className="map-control-btn" onClick={onResetRotation} title="Reset Rotation">
          🧭
        </button>
        <button className="map-control-btn" onClick={onFocusDelivery} title="Focus on Delivery">
          🚚
        </button>
        <button 
          className={`map-control-btn ${autoFocusEnabled ? 'auto-focus-active' : ''}`} 
          onClick={onAutoFocus} 
          title={autoFocusEnabled ? "Disable Auto Focus" : "Enable Auto Focus"}
        >
          👁
        </button>
      </div>
    </>
  );
};

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
  // Map rotation and focus states
  const [mapRotation, setMapRotation] = useState(0);
  const [autoFocusEnabled, setAutoFocusEnabled] = useState(true);
  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const lastLocationRef = useRef(null);
  const lastRouteInfoRef = useRef(null);
  const mapRef = useRef(null);

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 4000);
  };

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) return;
        const profile = await apiService.getUserProfile(userData.id);
        if (profile) {
          const updatedUser = {
            ...userData,
            ...profile,
            address: profile.location,
            phone: profile.phoneNumber,
            profilePicture: profile.profilePicture ? imagePathService.getImageUrl(profile.profilePicture) : null,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

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
      await apiService.updateOrderDeliveryStatus(orderId, 'PICKED_UP', userData.id);
      showBanner('success', `Order #${orderId} picked up successfully!`);
      // Refresh all order lists to ensure UI updates
      await Promise.all([
        loadReadyOrders(),
        loadActiveOrders(),
        loadDeliveredOrders()
      ]);
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
      await apiService.updateOrderDeliveryStatus(orderId, 'DELIVERED', userData.id);
      showBanner('success', `Order #${orderId} delivered successfully!`);
      // Refresh all order lists to ensure UI updates immediately
      await Promise.all([
        loadReadyOrders(),
        loadActiveOrders(),
        loadDeliveredOrders()
      ]);
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

  // Map control functions
  const handleRotateLeft = () => {
    const newRotation = mapRotation - 45;
    setMapRotation(newRotation);
  };

  const handleRotateRight = () => {
    const newRotation = mapRotation + 45;
    setMapRotation(newRotation);
  };

  const handleResetRotation = () => {
    setMapRotation(0);
  };

  const handleFocusDelivery = () => {
    if (deliveryLocation && mapRef.current) {
      // Temporarily disable auto focus, then focus on delivery location
      setAutoFocusEnabled(false);
      setTimeout(() => {
        mapRef.current.setView(deliveryLocation, 15);
      }, 100);
    }
  };

  const handleAutoFocus = () => {
    setAutoFocusEnabled(!autoFocusEnabled);
    showBanner('info', autoFocusEnabled ? 'Auto focus disabled' : 'Auto focus enabled');
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

  // Enhanced status colors with gradients
  const getStatusColor = (status) => {
    switch (status) {
      case 'READY': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      case 'PICKED_UP': return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white';
      case 'DELIVERED': return 'bg-gradient-to-r from-purple-500 to-pink-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
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

  // Enhanced Tab navigation UI
  const renderTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 p-2 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
      {[
        { id: 'READY', label: 'Ready for Pickup', icon: Package, count: readyOrders.length },
        { id: 'PICKED_UP', label: 'Picked Up', icon: Truck, count: activeOrders.length },
        { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle, count: deliveredOrders.length }
      ].map(({ id, label, icon: Icon, count }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex-1 sm:flex-none ${
            activeTab === id
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
          }`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{label}</span>
          {count > 0 && (
            <Badge 
              className={`text-xs px-2 py-1 ${
                activeTab === id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {count}
            </Badge>
          )}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Location Tracker */}
      <LocationTracker onLocationUpdate={handleLocationUpdate} isTracking={isLocationTracking} />
      
      {banner.show && (
        <Banner 
          type={banner.type} 
          message={banner.message} 
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Delivery Dashboard
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.username}!</p>
                {deliveryLocation && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    📍 GPS Active: {deliveryLocation[0].toFixed(4)}, {deliveryLocation[1].toFixed(4)}
                  </p>
                )}
              </div>
            </div>
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-gray-50 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {user?.username ? user.username.charAt(0).toUpperCase() : 'D'}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-900">{user?.username || 'Delivery'}</div>
                  <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">{user?.role || 'Delivery'}</div>
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 top-16 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                        {user?.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt="Profile" 
                            className="w-16 h-16 rounded-2xl object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-xl">
                            {user?.username ? user.username.charAt(0).toUpperCase() : 'D'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{user?.username || 'Delivery'}</h3>
                        <p className="text-sm text-blue-600 font-medium uppercase tracking-wide">{user?.role || 'Delivery'}</p>
                        <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      {user?.phone && (
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user?.address && (
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{user.address}</span>
                        </div>
                      )}
                      {deliveryLocation && (
                        <div className="flex items-center space-x-3 text-sm text-green-600">
                          <Navigation className="w-4 h-4" />
                          <span>GPS: {deliveryLocation[0].toFixed(4)}, {deliveryLocation[1].toFixed(4)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <Button
                        onClick={handleLogout}
                        className="w-full justify-start bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderTabs()}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Enhanced Orders Panel */}
          <div className="space-y-6">
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50/50 border-gray-200/50 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                    {activeTab === 'READY' && (
                      <>
                        <Package className="w-6 h-6 mr-2 text-green-600" />
                        Ready for Pickup
                      </>
                    )}
                    {activeTab === 'PICKED_UP' && (
                      <>
                        <Truck className="w-6 h-6 mr-2 text-blue-600" />
                        On Delivery
                      </>
                    )}
                    {activeTab === 'DELIVERED' && (
                      <>
                        <CheckCircle className="w-6 h-6 mr-2 text-purple-600" />
                        Delivered
                      </>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {getTabOrders().length} {getTabOrders().length === 1 ? 'order' : 'orders'}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    loadReadyOrders();
                    loadActiveOrders();
                    loadDeliveredOrders();
                  }} 
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {getTabOrders().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      {activeTab === 'READY' && <Package className="w-10 h-10 text-gray-400" />}
                      {activeTab === 'PICKED_UP' && <Truck className="w-10 h-10 text-gray-400" />}
                      {activeTab === 'DELIVERED' && <CheckCircle className="w-10 h-10 text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders</h3>
                    <p className="text-gray-600">No orders in this category at the moment.</p>
                  </div>
                ) : (
                  getTabOrders().map((order) => (
                    <Card 
                      key={order.orderId} 
                      className="p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 bg-gradient-to-r from-white to-gray-50/50 border-gray-200/50"
                      onClick={() => setSelectedOrder(order)}
                      hover
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Order #{order.orderId}</h3>
                            <p className="text-sm text-gray-600">Customer ID: {order.userId}</p>
                            <p className="text-xs text-gray-500">{formatDate(order.orderDate)}</p>
                          </div>
                        </div>
                        <Badge 
                          className={`${getStatusColor(order.status)} px-3 py-1 font-semibold shadow-lg`}
                          size="sm"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 mb-6 bg-gray-50/50 rounded-xl p-4">
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">{order.deliveryLocation}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Phone className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-medium">{order.deliveryPhone}</span>
                        </div>
                        {order.amount && (
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-sm text-gray-600">{order.orderItems?.length || 0} items</span>
                            <span className="text-lg font-bold text-gray-900">₹{order.amount}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        {activeTab === 'READY' && (
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl"
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
                              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl"
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
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl"
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
                            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-lg hover:shadow-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setShowMap(true);
                            }}
                          >
                            <Route className="w-4 h-4 mr-2" />
                            View Route
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Enhanced Map Panel */}
          <div className="space-y-6">
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-indigo-50/50 border-indigo-200/50 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                    <Navigation className="w-6 h-6 mr-2 text-indigo-600" />
                    Live Tracking Map
                  </h2>
                                     {routeInfo && (
                     <div className="flex flex-wrap gap-4 mt-2 text-sm">
                       <div className="flex items-center space-x-1">
                         <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                         <span className="font-medium">Distance:</span> 
                         <span className="text-blue-600 font-bold">{routeInfo.distance} km</span>
                       </div>
                       <div className="flex items-center space-x-1">
                         <Clock className="w-3 h-3 text-green-600" />
                         <span className="font-medium">ETA:</span> 
                         <span className="text-green-600 font-bold">{routeInfo.time} min</span>
                       </div>
                     </div>
                   )}
                 </div>
                 
                 {/* Location Tracking Controls */}
                 <div className="flex flex-col sm:flex-row items-center gap-3">
                   <Button
                     size="sm"
                     className={`flex items-center space-x-2 shadow-lg font-semibold px-4 py-2 ${
                       isLocationTracking 
                         ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 hover:from-red-600 hover:to-pink-700' 
                         : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 hover:from-emerald-600 hover:to-teal-700'
                     }`}
                     onClick={toggleLocationTracking}
                   >
                     <Navigation className="w-4 h-4" />
                     <span>{isLocationTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
                   </Button>
                   <Badge 
                     className={`px-3 py-2 shadow-lg font-semibold text-xs ${
                       isLocationTracking 
                         ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                         : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                     }`}
                   >
                     {isLocationTracking ? '🟢 LIVE TRACKING' : '🔴 OFFLINE'}
                   </Badge>
                 </div>
               </div>
              {showMap && selectedOrder ? (
                <div className="h-96 rounded-lg overflow-hidden border border-gray-200 relative">
                  <div 
                    className="map-container-rotated h-full w-full"
                    style={{ transform: `rotate(${mapRotation}deg)` }}
                  >
                    <MapContainer
                      center={mapCenter}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      ref={mapRef}
                      dragging={true}
                      touchZoom={true}
                      doubleClickZoom={true}
                      scrollWheelZoom={true}
                      boxZoom={true}
                      keyboard={true}
                      zoomControl={true}
                    >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Auto focus component */}
                    {autoFocusEnabled && (
                      <MapAutoFocus 
                        deliveryLocation={deliveryLocation || lastLocationRef.current}
                        customerLocation={customerLocation}
                      />
                    )}
                    
                    {/* Delivery person location */}
                    <DeliveryMarker position={deliveryLocation || lastLocationRef.current} />
                    
                    {/* Customer location and routing */}
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
                  
                  {/* Compass Indicator */}
                  <div className="compass-indicator" title={`Rotation: ${mapRotation}°`}>
                    🧭
                  </div>
                  
                  {/* Map Control Buttons */}
                  <MapControls
                    onRotateLeft={handleRotateLeft}
                    onRotateRight={handleRotateRight}
                    onResetRotation={handleResetRotation}
                    onFocusDelivery={handleFocusDelivery}
                    onAutoFocus={handleAutoFocus}
                    autoFocusEnabled={autoFocusEnabled}
                  />
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center border border-gray-200 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Navigation className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Ready</h3>
                  <p className="text-gray-600 text-center px-4">
                    Click 'Navigate' or 'View Route' on an order to see the delivery route
                  </p>
                </div>
              )}
              {/* Enhanced close button for the map */}
              {showMap && (
                <div className="mt-4 flex justify-end">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-lg hover:shadow-xl" 
                    onClick={() => setShowMap(false)}
                  >
                    Close Map
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
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
          <strong>🚚 Delivery Truck</strong><br/>
          <span className="text-sm text-blue-600">On the way to deliver!</span><br/>
          📍 {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      </Popup>
    </Marker>
  );
};