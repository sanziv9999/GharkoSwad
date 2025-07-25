import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { 
  Phone, 
  Clock, 
  MapPin, 
  CheckCircle, 
  Package, 
  Truck, 
  Home, 
  ChefHat, 
  Utensils,
  Navigation,
  Timer,
  User,
  Calendar,
  DollarSign,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Banner from '../../components/ui/Banner';
import Modal from '../../components/ui/Modal';
import imagePathService from '../../services/imageLocation/imagePath';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import L from 'leaflet';

// Add styles to hide routing control UI and fix z-index issues
const routingStyles = `
  .leaflet-routing-container {
    display: none !important;
  }
  .leaflet-routing-alt {
    display: none !important;
  }
  .leaflet-container {
    z-index: 1 !important;
  }
  .leaflet-popup {
    z-index: 1000 !important;
  }
  .leaflet-marker-pane {
    z-index: 800 !important;
  }
  .leaflet-marker-icon {
    z-index: 900 !important;
  }
  .leaflet-popup-content-wrapper {
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  }
  .leaflet-popup-tip {
    background: white !important;
  }
  .custom-truck-icon, .custom-customer-icon {
    transition: transform 0.2s ease;
    z-index: 1000 !important;
    position: relative;
  }
  .custom-truck-icon:hover, .custom-customer-icon:hover {
    transform: scale(1.1);
    z-index: 1001 !important;
  }
  .leaflet-marker-icon.custom-truck-icon,
  .leaflet-marker-icon.custom-customer-icon {
    z-index: 1000 !important;
  }
  .route-line {
    transition: all 0.3s ease;
    z-index: 100 !important;
  }
  .leaflet-marker-shadow {
    z-index: 999 !important;
  }
  .leaflet-overlay-pane {
    z-index: 200 !important;
  }
  .leaflet-shadow-pane {
    z-index: 500 !important;
  }
  .map-controls {
    position: absolute;
    top: 15px;
    right: 15px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 3px;
    pointer-events: auto;
  }
  .map-control-btn {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
  }
  .map-control-btn:hover {
    background: rgba(240, 240, 240, 0.95);
    border-color: #10B981;
    transform: scale(1.02);
  }
  .map-control-btn.active {
    background: rgba(16, 185, 129, 0.9);
    color: white;
    border-color: #10B981;
  }
  .compass-indicator {
    position: absolute;
    bottom: 15px;
    right: 15px;
    z-index: 10;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
    pointer-events: auto;
  }
  
  @media (max-width: 768px) {
    .map-controls {
      top: 10px;
      right: 10px;
      gap: 2px;
    }
    .map-control-btn {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }
    .compass-indicator {
      bottom: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
      font-size: 12px;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = routingStyles;
  document.head.appendChild(style);
}

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons with fallback
const createCustomIcon = (color = 'red', iconSize = [25, 41]) => {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Delivery truck icon - More prominent
const deliveryTruckIcon = L.divIcon({
  className: 'custom-truck-icon',
  html: `
    <div style="
      background: #10B981;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      position: relative;
      z-index: 1000;
    ">
      <span style="color: white; font-size: 20px; font-weight: bold;">🚚</span>
      <div style="
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        background: #F59E0B;
        border-radius: 50%;
        border: 2px solid white;
        z-index: 1001;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Customer location icon - More prominent
const customerIcon = L.divIcon({
  className: 'custom-customer-icon',
  html: `
    <div style="
      background: #DC2626;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      position: relative;
      z-index: 1000;
    ">
      <span style="color: white; font-size: 20px; font-weight: bold;">🏠</span>
      <div style="
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        background: #EF4444;
        border-radius: 50%;
        border: 2px solid white;
        z-index: 1001;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Routing component for real-time route display
const RoutingControl = ({ driverLocation, customerLocation, onRouteFound }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!driverLocation || !customerLocation) return;

    // Cleanup existing routing control
    try {
      if (
        routingControlRef.current &&
        routingControlRef.current._map &&
        routingControlRef.current._container
      ) {
        routingControlRef.current.spliceWaypoints(0, 2);
        routingControlRef.current._map = null;
        map.removeControl(routingControlRef.current);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    routingControlRef.current = null;

    // Create new routing control with better styling and error handling
    try {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(driverLocation[0], driverLocation[1]),
          L.latLng(customerLocation[0], customerLocation[1])
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        createMarker: () => null, // Don't create default markers
                 lineOptions: {
           styles: [
             { 
               color: '#10B981', 
               weight: 6, 
               opacity: 0.9,
               className: 'route-line'
             }
           ]
         },
        show: false, // Hide the directions panel
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          timeout: 10000
        })
      })
      .on('routesfound', function(e) {
        try {
          const routes = e.routes;
          if (routes && routes.length > 0) {
            const route = routes[0];
            const distance = (route.summary.totalDistance / 1000).toFixed(2); // km
            const time = Math.round(route.summary.totalTime / 60); // min
            onRouteFound && onRouteFound({ distance, time, route });
          }
        } catch (err) {
          console.warn('Route processing error:', err);
        }
      })
      .on('routingerror', function(e) {
        console.warn('Routing error:', e.error);
      })
      .addTo(map);
    } catch (err) {
      console.error('Error creating routing control:', err);
    }

    return () => {
      try {
        if (
          routingControlRef.current &&
          routingControlRef.current._map &&
          routingControlRef.current._container
        ) {
          routingControlRef.current.spliceWaypoints(0, 2);
          routingControlRef.current._map = null;
          map.removeControl(routingControlRef.current);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      routingControlRef.current = null;
    };
  }, [map, driverLocation, customerLocation, onRouteFound]);

  return null;
};

// Map Controls Component
const MapControls = ({ 
  onRotateLeft, 
  onRotateRight, 
  onResetRotation, 
  onToggleAutoRotate, 
  onTogglePathFocus,
  onFocusPath,
  autoRotateEnabled,
  pathFocusEnabled,
  mapRotation 
}) => {
  return (
    <>
      <div className="map-controls">
        <button 
          className="map-control-btn" 
          onClick={onRotateLeft} 
          title="Rotate Left"
        >
          ↺
        </button>
        <button 
          className="map-control-btn" 
          onClick={onRotateRight} 
          title="Rotate Right"
        >
          ↻
        </button>
        <button 
          className="map-control-btn" 
          onClick={onResetRotation} 
          title="Reset Rotation"
        >
          🧭
        </button>
        <button 
          className={`map-control-btn ${autoRotateEnabled ? 'active' : ''}`} 
          onClick={onToggleAutoRotate} 
          title={autoRotateEnabled ? "Disable Auto Rotate" : "Enable Auto Rotate"}
        >
          🔄
        </button>
        <button 
          className={`map-control-btn ${pathFocusEnabled ? 'active' : ''}`} 
          onClick={onTogglePathFocus} 
          title={pathFocusEnabled ? "Disable Path Focus" : "Enable Path Focus"}
        >
          👁
        </button>
        <button 
          className="map-control-btn" 
          onClick={onFocusPath} 
          title="Focus on Route"
        >
          🎯
        </button>
      </div>
      <div 
        className="compass-indicator" 
        title={`Rotation: ${mapRotation}°`}
        style={{ transform: `rotate(${-mapRotation}deg)` }}
      >
        🧭
      </div>
    </>
  );
};

// Map Auto Focus Component for path focusing
const MapAutoFocus = ({ driverLocation, customerLocation, pathFocusEnabled }) => {
  const map = useMap();

  useEffect(() => {
    if (!pathFocusEnabled || !driverLocation || !customerLocation) return;

    // Debounce the focus operation
    const timeoutId = setTimeout(() => {
      try {
        // Create bounds that include both locations with padding
        const bounds = L.latLngBounds([driverLocation, customerLocation]);
        const paddedBounds = bounds.pad(0.2); // Add 20% padding for better view
        
        // Fit map to show both points with responsive zoom
        map.fitBounds(paddedBounds, { 
          padding: [30, 30],
          maxZoom: 15,
          minZoom: 10,
          animate: true,
          duration: 0.5
        });
      } catch (error) {
        console.warn('Map focus error:', error);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [map, driverLocation, customerLocation, pathFocusEnabled]);

  return null;
};

// Map update component for real-time updates
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      try {
        // Only update view if center actually changed
        const currentCenter = map.getCenter();
        const centerChanged = Math.abs(currentCenter.lat - center[0]) > 0.0001 || 
                             Math.abs(currentCenter.lng - center[1]) > 0.0001;
        
        if (centerChanged) {
          map.setView(center, zoom || map.getZoom(), { animate: true });
        }
      } catch (error) {
        console.warn('Map view update error:', error);
      }
    }
  }, [center, zoom, map]);
  
  return null;
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [driverLocation, setDriverLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState('15-20 min');
  const [currentStep, setCurrentStep] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [cancelling, setCancelling] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [mapRotation, setMapRotation] = useState(0);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(false);
  const [pathFocusEnabled, setPathFocusEnabled] = useState(true);
  
  const intervalRef = useRef(null);
  const mapRef = useRef(null);
  const lastRouteInfoRef = useRef(null);
  const rotationIntervalRef = useRef(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user?.id) {
        setError('Please log in to track your order');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.get(`/orders/user/${user.id}/status`);
        console.log('Orders response:', response);
        
        if (response.data && Array.isArray(response.data)) {
          const foundOrder = response.data.find(o => o.orderId === parseInt(orderId));
          if (foundOrder) {
            setOrder(foundOrder);
            initializeDriverLocation(foundOrder);
            setCurrentStep(getCurrentStepIndex(foundOrder.status));
          } else {
            setError('Order not found');
          }
        } else {
          setError('Failed to fetch order details');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, user?.id]);

  // Initialize driver location based on order status
  const initializeDriverLocation = (orderData) => {
    try {
      const deliveryCoords = JSON.parse(orderData.deliveryCoordinates);
      
      // Set initial driver location based on order status
      if (orderData.status === 'PLACED' || orderData.status === 'CONFIRMED') {
        // Driver starts from restaurant location (simulated)
        setDriverLocation([deliveryCoords[0] - 0.01, deliveryCoords[1] - 0.01]);
      } else if (orderData.status === 'PREPARING' || orderData.status === 'READY') {
        // Driver is at restaurant
        setDriverLocation([deliveryCoords[0] - 0.005, deliveryCoords[1] - 0.005]);
      } else if (orderData.status === 'PICKED_UP') {
        // Driver is on the way
        setDriverLocation([deliveryCoords[0] - 0.003, deliveryCoords[1] - 0.003]);
        setEstimatedTime('10-15 min');
      } else if (orderData.status === 'DELIVERED') {
        // Driver has reached destination
        setDriverLocation(deliveryCoords);
        setEstimatedTime('Delivered!');
      }
    } catch (err) {
      console.error('Error parsing delivery coordinates:', err);
      setDriverLocation([27.7172, 85.3240]); // Default location
    }
  };

  // Real-time driver movement simulation
  useEffect(() => {
    if (!order || !driverLocation || order.status === 'DELIVERED') return;

    intervalRef.current = setInterval(() => {
      setDriverLocation(prev => {
        if (!prev) return prev;
        
        try {
          const deliveryCoords = JSON.parse(order.deliveryCoordinates);
          const currentLat = prev[0];
          const currentLng = prev[1];
          const targetLat = deliveryCoords[0];
          const targetLng = deliveryCoords[1];
          
          // Calculate distance to destination
          const latDiff = targetLat - currentLat;
          const lngDiff = targetLng - currentLng;
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          
          // If very close to destination, stop movement
          if (distance < 0.0001) {
            return deliveryCoords;
          }
          
          // Move driver closer to destination
          const moveSpeed = 0.0001; // Adjust for faster/slower movement
          const latMove = latDiff * moveSpeed;
          const lngMove = lngDiff * moveSpeed;
          
          const newLat = currentLat + latMove;
          const newLng = currentLng + lngMove;
          
          // Update estimated time based on distance
          const newDistance = Math.sqrt(
            Math.pow(targetLat - newLat, 2) + Math.pow(targetLng - newLng, 2)
          );
          
          if (newDistance < 0.001) {
            setEstimatedTime('5-10 min');
          } else if (newDistance < 0.003) {
            setEstimatedTime('10-15 min');
          } else {
            setEstimatedTime('15-20 min');
          }
          
          return [newLat, newLng];
        } catch (err) {
          console.error('Error updating driver location:', err);
          return prev;
        }
      });
    }, 2000); // Update every 2 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [order, driverLocation]);

  const getStatusInfo = (status) => {
    const statusMap = {
      'PLACED': { 
        label: 'Order Placed', 
        color: 'warning', 
        icon: Package, 
        bgColor: 'bg-yellow-50', 
        textColor: 'text-yellow-800',
        description: 'Your order has been received and is being processed'
      },
      'CONFIRMED': { 
        label: 'Order Confirmed', 
        color: 'primary', 
        icon: CheckCircle, 
        bgColor: 'bg-blue-50', 
        textColor: 'text-blue-800',
        description: 'Your order has been confirmed and is being prepared'
      },
      'PREPARING': { 
        label: 'Preparing Food', 
        color: 'warning', 
        icon: ChefHat, 
        bgColor: 'bg-orange-50', 
        textColor: 'text-orange-800',
        description: 'Our chef is preparing your delicious meal'
      },
      'READY': { 
        label: 'Ready for Pickup', 
        color: 'success', 
        icon: Utensils, 
        bgColor: 'bg-green-50', 
        textColor: 'text-green-800',
        description: 'Your food is ready and waiting for pickup'
      },
      'PICKED_UP': { 
        label: 'Out for Delivery', 
        color: 'primary', 
        icon: Truck, 
        bgColor: 'bg-blue-50', 
        textColor: 'text-blue-800',
        description: 'Your food is on its way to you'
      },
      'DELIVERED': { 
        label: 'Delivered', 
        color: 'success', 
        icon: Home, 
        bgColor: 'bg-green-50', 
        textColor: 'text-green-800',
        description: 'Your order has been successfully delivered'
      },
      'CANCELLED': { 
        label: 'Cancelled', 
        color: 'error', 
        icon: Package, 
        bgColor: 'bg-red-50', 
        textColor: 'text-red-800',
        description: 'Your order has been cancelled'
      },
    };
    return statusMap[status] || statusMap['PLACED'];
  };

  const getCurrentStepIndex = (status) => {
    const stepMap = {
      'PLACED': 0,
      'CONFIRMED': 1,
      'PREPARING': 2,
      'READY': 3,
      'PICKED_UP': 4,
      'DELIVERED': 5
    };
    return stepMap[status] || 0;
  };

  const orderSteps = [
    { 
      key: 'PLACED', 
      label: 'Order Placed', 
      icon: Package,
      description: 'Order received and confirmed',
      time: '2 min ago'
    },
    { 
      key: 'CONFIRMED', 
      label: 'Order Confirmed', 
      icon: CheckCircle,
      description: 'Order confirmed by restaurant',
      time: '1 min ago'
    },
    { 
      key: 'PREPARING', 
      label: 'Preparing Food', 
      icon: ChefHat,
      description: 'Chef is preparing your meal',
      time: 'Now'
    },
    { 
      key: 'READY', 
      label: 'Ready for Pickup', 
      icon: Utensils,
      description: 'Food is ready for delivery',
      time: ''
    },
    { 
      key: 'PICKED_UP', 
      label: 'Out for Delivery', 
      icon: Truck,
      description: 'Driver is on the way',
      time: ''
    },
    { 
      key: 'DELIVERED', 
      label: 'Delivered', 
      icon: Home,
      description: 'Order delivered successfully',
      time: ''
    },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 4000);
  };

  const handleCancelOrder = () => {
    if (!order?.orderItems || order.orderItems.length === 0) {
      showBanner('error', 'No order items found to cancel');
      return;
    }
    
    // Initialize with all items selected - use the orderItem.id field
    setSelectedItems(order.orderItems.map(item => item.id));
    setShowCancelModal(true);
  };

  const handleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleConfirmCancel = async () => {
    if (selectedItems.length === 0) {
      showBanner('error', 'Please select at least one item to cancel');
      return;
    }

    try {
      setCancelling(true);
      // Get user ID from localStorage and order ID from order data
      const userData = JSON.parse(localStorage.getItem('user'));
      const userId = userData?.id || user?.id;
      const orderId = order?.orderId;
      
      if (!userId || !orderId) {
        showBanner('error', 'Missing user or order information');
        return;
      }
      
      console.log('Cancelling order with:', { userId, orderId, selectedItems });
      // Pass selectedItems array to cancel specific items
      const response = await apiService.cancelOrder(userId, selectedItems);
      
      if (response.status === 'success') {
        showBanner('success', response.message || 'Order items cancelled successfully');
        
        // Update the order to reflect cancelled items
        setOrder(prev => ({
          ...prev,
          orderItems: prev.orderItems.filter(item => !selectedItems.includes(item.id))
        }));
        
        setShowCancelModal(false);
        setSelectedItems([]);
        
        // If all items are cancelled, redirect to orders page
        const remainingItems = order.orderItems.filter(item => !selectedItems.includes(item.id));
        if (remainingItems.length === 0) {
          setTimeout(() => {
            navigate('/my-orders');
          }, 2000);
        }
      } else {
        showBanner('error', response.message || 'Failed to cancel order items');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      showBanner('error', err.message || 'Failed to cancel order items');
    } finally {
      setCancelling(false);
    }
  };

  const canCancelOrder = () => {
    // Only allow cancellation for certain statuses
    const cancellableStatuses = ['PLACED', 'CONFIRMED', 'PREPARING'];
    return cancellableStatuses.includes(order?.status);
  };

  // Handle route found to prevent infinite loops
  const handleRouteFound = (info) => {
    if (!lastRouteInfoRef.current ||
        info.distance !== lastRouteInfoRef.current.distance ||
        info.time !== lastRouteInfoRef.current.time) {
      setRouteInfo(info);
      lastRouteInfoRef.current = info;
    }
  };

  // Map control handlers
  const handleRotateLeft = () => {
    setMapRotation(prev => prev - 45);
  };

  const handleRotateRight = () => {
    setMapRotation(prev => prev + 45);
  };

  const handleResetRotation = () => {
    setMapRotation(0);
  };

  const handleToggleAutoRotate = () => {
    setAutoRotateEnabled(prev => !prev);
  };

  const handleTogglePathFocus = () => {
    setPathFocusEnabled(prev => !prev);
  };

  const handleFocusPath = () => {
    if (mapRef.current && driverLocation && deliveryCoords) {
      const bounds = L.latLngBounds([driverLocation, deliveryCoords]);
      const paddedBounds = bounds.pad(0.15);
      mapRef.current.fitBounds(paddedBounds, { 
        padding: [30, 30],
        maxZoom: 15,
        animate: true
      });
    }
  };

  // Auto-rotation effect
  useEffect(() => {
    if (autoRotateEnabled) {
      rotationIntervalRef.current = setInterval(() => {
        setMapRotation(prev => (prev + 10) % 360);
      }, 1000); // Rotate 10 degrees every second
    } else {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    }

    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
    };
  }, [autoRotateEnabled]);

  // Parse delivery coordinates safely
  const deliveryCoords = useMemo(() => {
    if (!order?.deliveryCoordinates) return [27.7172, 85.3240]; // Default location
    try {
      return JSON.parse(order.deliveryCoordinates);
    } catch {
      return [27.7172, 85.3240];
    }
  }, [order?.deliveryCoordinates]);

  // Memoized routing control to prevent infinite loops
  const memoizedRoutingControl = useMemo(() => {
    if (driverLocation && deliveryCoords && order?.status && order.status !== 'DELIVERED') {
      return (
        <RoutingControl
          driverLocation={driverLocation}
          customerLocation={deliveryCoords}
          onRouteFound={handleRouteFound}
        />
      );
    }
    return null;
  }, [
    driverLocation && deliveryCoords && order?.status && order.status !== 'DELIVERED'
      ? driverLocation[0].toFixed(5) + ',' + driverLocation[1].toFixed(5) + '-' + deliveryCoords[0].toFixed(5) + ',' + deliveryCoords[1].toFixed(5) + '-' + order.status
      : 'no-route'
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Order Details</h2>
          <p className="text-gray-600">Please wait while we fetch your order information...</p>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="p-6 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-600 mb-6">{error || 'Please check your order ID and try again.'}</p>
          <div className="space-x-4">
            <Button onClick={() => navigate('/my-orders')}>
              View My Orders
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-4 lg:py-8">
      {banner.show && (
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Order #{order.orderId}</span>
                <span>•</span>
                <span>{formatDate(order.orderDate)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={statusInfo.color} className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold">
                <StatusIcon className="w-5 h-5" />
                <span>{statusInfo.label}</span>
              </Badge>
              
              {canCancelOrder() && (
                <Button 
                  variant="outline" 
                  onClick={handleCancelOrder}
                  className="text-red-600 border-red-600 hover:bg-red-50 font-medium px-4 py-2"
                >
                  Cancel Order
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/my-orders')}
                className="font-medium px-4 py-2"
              >
                Back to Orders
              </Button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            {/* Title and Order Info */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Your Order</h1>
              <div className="space-y-1">
                <p className="text-gray-600 text-sm">Order #{order.orderId}</p>
                <p className="text-gray-500 text-xs">{formatDate(order.orderDate)}</p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge variant={statusInfo.color} className="flex items-center space-x-2 px-4 py-3 text-sm font-semibold">
                <StatusIcon className="w-5 h-5" />
                <span>{statusInfo.label}</span>
              </Badge>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              {canCancelOrder() && (
                <Button 
                  variant="outline" 
                  onClick={handleCancelOrder}
                  className="text-red-600 border-red-600 hover:bg-red-50 font-medium px-6 py-2.5"
                >
                  Cancel Order
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate('/my-orders')}
                className="font-medium px-6 py-2.5"
              >
                Back to Orders
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Live Tracking Map */}
            <Card className="p-4 lg:p-6 border-2 border-gray-300 shadow-lg bg-white">
              <div className="space-y-4 mb-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg lg:text-xl font-bold text-gray-900">Live Tracking</h2>
                  </div>
                  <div className="flex items-center space-x-2 justify-center sm:justify-start">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs lg:text-sm text-gray-600 font-medium">Live Updates</span>
                  </div>
                </div>
                
                {/* Route Info - Mobile Responsive */}
                {routeInfo && driverLocation && order.status !== 'DELIVERED' && (
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                    <div className="flex items-center justify-center space-x-2 bg-white rounded-lg py-3 px-3 border border-gray-200 shadow-sm">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 font-medium">Distance</p>
                        <p className="text-sm lg:text-base text-emerald-600 font-bold">{routeInfo.distance} km</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-2 bg-white rounded-lg py-3 px-3 border border-gray-200 shadow-sm">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <div className="text-center">
                        <p className="text-xs text-gray-600 font-medium">ETA</p>
                        <p className="text-sm lg:text-base text-orange-600 font-bold">{routeInfo.time} min</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div 
                className="h-96 rounded-lg overflow-hidden border border-gray-200 relative bg-gray-100" 
                style={{ 
                  zIndex: 1, 
                  isolation: 'isolate',
                  contain: 'layout'
                }}
              >
                <div 
                  style={{ 
                    height: '100%', 
                    width: '100%',
                    transform: `rotate(${mapRotation}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <MapContainer
                    center={deliveryCoords}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Auto Focus Component */}
                    <MapAutoFocus 
                      driverLocation={driverLocation}
                      customerLocation={deliveryCoords}
                      pathFocusEnabled={pathFocusEnabled}
                    />
                    
                    {/* Customer Location */}
                    <Marker 
                      position={deliveryCoords}
                      icon={customerIcon}
                      zIndexOffset={1000}
                    >
                      <Popup className="custom-popup">
                        <div className="text-center p-2">
                          <Home className="w-6 h-6 mx-auto mb-2 text-red-500" />
                          <p className="font-semibold text-gray-900">Delivery Address</p>
                          <p className="text-sm text-gray-600">{order.deliveryLocation}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Driver Location */}
                    {driverLocation && order.status !== 'DELIVERED' && (
                      <Marker 
                        position={driverLocation}
                        icon={deliveryTruckIcon}
                        zIndexOffset={1001}
                      >
                        <Popup className="custom-popup">
                          <div className="text-center p-2">
                            <Truck className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                            <p className="font-semibold text-gray-900">Delivery Partner</p>
                            <p className="text-sm text-gray-600">
                              ETA: {routeInfo && driverLocation ? `${routeInfo.time} min` : estimatedTime}
                            </p>
                            {routeInfo && (
                              <p className="text-xs text-gray-500">{routeInfo.distance} km away</p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Route Line with actual routing */}
                    {memoizedRoutingControl}
                    
                    <MapUpdater center={deliveryCoords} zoom={15} />
                  </MapContainer>
                </div>
                
                {/* Map Controls */}
                <MapControls
                  onRotateLeft={handleRotateLeft}
                  onRotateRight={handleRotateRight}
                  onResetRotation={handleResetRotation}
                  onToggleAutoRotate={handleToggleAutoRotate}
                  onTogglePathFocus={handleTogglePathFocus}
                  onFocusPath={handleFocusPath}
                  autoRotateEnabled={autoRotateEnabled}
                  pathFocusEnabled={pathFocusEnabled}
                  mapRotation={mapRotation}
                />
              </div>
            </Card>

            {/* Order Progress Timeline */}
            <Card className="p-4 lg:p-6 border-2 border-gray-300 shadow-lg bg-white">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-6 text-center lg:text-left">Order Progress</h2>
              <div className="space-y-5 lg:space-y-6">
                {orderSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  const StepIcon = step.icon;
                  
                  return (
                    <div key={step.key} className="relative">
                      {/* Connection Line */}
                      {index < orderSteps.length - 1 && (
                        <div className={`absolute left-5 lg:left-6 top-11 lg:top-12 w-0.5 h-12 lg:h-16 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}></div>
                      )}
                      
                      <div className="flex items-start space-x-3 lg:space-x-4">
                        {/* Step Icon */}
                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted 
                            ? 'bg-emerald-500 text-white shadow-lg' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6" />
                          ) : (
                            <StepIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                          )}
                        </div>
                        
                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                            <h3 className={`text-base lg:text-lg font-semibold mb-1 ${
                              isCurrent ? 'text-emerald-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {step.label}
                            </h3>
                            {step.time && (
                              <span className="text-xs lg:text-sm text-gray-500 flex-shrink-0">{step.time}</span>
                            )}
                          </div>
                                                     <p className={`text-xs lg:text-sm ${
                             isCurrent ? 'text-emerald-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                           }`}>
                            {step.description}
                          </p>
                          
                          {/* Current step indicator */}
                          {isCurrent && (
                                                         <div className="mt-2 flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                               <span className="text-xs lg:text-sm text-emerald-600 font-medium">In Progress</span>
                             </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:space-y-6">
            {/* Order Summary */}
            <Card className="p-4 lg:p-6 border-2 border-gray-300 shadow-lg bg-white">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 text-center lg:text-left">Order Summary</h2>
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm lg:text-base">Order ID</span>
                  <span className="font-semibold text-sm lg:text-base">#{order.orderId}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm lg:text-base">Total Amount</span>
                  <span className="font-bold text-lg lg:text-xl text-green-600">₹{order.amount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm lg:text-base">Payment Method</span>
                  <span className="font-semibold text-sm lg:text-base text-right">{order.paymentMethod?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 text-sm lg:text-base">Payment Status</span>
                  <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'} className="text-xs">
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Estimated Delivery */}
            <Card className="p-4 lg:p-6 border-2 border-gray-300 shadow-lg bg-emerald-50">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto sm:mx-0">
                    <Timer className="w-6 h-6 text-emerald-600" />
                  </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-gray-900 text-base lg:text-lg">Estimated Delivery</h3>
                  <p className="text-xs lg:text-sm text-gray-600">Your food will arrive soon</p>
                </div>
              </div>
                              <div className="text-center bg-white rounded-xl py-4 px-3 border border-gray-200 shadow-sm">
                  <p className="text-2xl lg:text-3xl font-bold text-emerald-600 mb-2">
                  {order.status === 'DELIVERED' 
                    ? 'Delivered!' 
                    : (routeInfo && driverLocation 
                        ? `${routeInfo.time} min` 
                        : estimatedTime
                      )
                  }
                </p>
                <p className="text-xs lg:text-sm text-gray-600 px-2">
                  {order.status === 'DELIVERED' 
                    ? 'Thank you for your order!' 
                    : (routeInfo && driverLocation 
                        ? `${routeInfo.distance} km away` 
                        : 'We\'ll notify you when it arrives'
                      )
                  }
                </p>
              </div>
            </Card>

            {/* Delivery Information */}
            <Card className="p-4 lg:p-6 border-2 border-gray-300 shadow-lg bg-white">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 text-center lg:text-left">Delivery Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm lg:text-base mb-1">Delivery Address</p>
                    <p className="text-xs lg:text-sm text-gray-600 break-words">{order.deliveryLocation}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm lg:text-base mb-1">Contact Number</p>
                    <p className="text-xs lg:text-sm text-gray-600">{order.deliveryPhone}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-4 lg:p-6 border-2 border-gray-300 shadow-lg bg-white">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 text-center lg:text-left">Order Items</h2>
              <div className="space-y-3 max-h-64 lg:max-h-80 overflow-y-auto">
                {order.orderItems?.map((orderItem, index) => {
                  const foodItem = orderItem.foodItem;
                  return (
                    <div key={orderItem.id || `order-item-${index}`} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                      <img
                        src={imagePathService.getImageUrl(foodItem.imagePath)}
                        alt={foodItem.name}
                        className="w-14 h-14 lg:w-16 lg:h-16 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm lg:text-base truncate">{foodItem.name}</h4>
                        <p className="text-xs lg:text-sm text-gray-600 mb-1">Qty: {orderItem.quantity}</p>
                        <p className="text-xs text-gray-500">₹{foodItem.price?.toFixed(2)} each</p>
                      </div>
                                             <div className="text-right flex-shrink-0">
                         <p className="font-bold text-sm lg:text-base text-emerald-600">
                           ₹{(foodItem.price * orderItem.quantity)?.toFixed(2)}
                         </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Action Buttons */}
            <Card className="p-4 lg:p-6 border-2 border-gray-300 shadow-lg bg-gray-50">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 py-3 font-medium border-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-sm lg:text-base">Contact Support</span>
                </Button>
                                  <Button
                    onClick={() => navigate('/menu')}
                    className="w-full py-3 font-semibold text-sm lg:text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                  >
                    Order Again
                  </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Order Items"
      >
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Select Items to Cancel</h3>
            </div>
            <p className="text-gray-600">
              Choose the items you want to cancel from your order. Cancelled items cannot be restored.
            </p>
          </div>

          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {order?.orderItems?.map((orderItem) => {
              const foodItem = orderItem.foodItem;
              const isSelected = selectedItems.includes(orderItem.id);
              
              return (
                <div 
                  key={orderItem.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleItemSelection(orderItem.id)}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'border-red-500 bg-red-500' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  
                  <img
                    src={imagePathService.getImageUrl(foodItem.imagePath)}
                    alt={foodItem.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                  />
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{foodItem.name}</h4>
                    <p className="text-sm text-gray-600">Qty: {orderItem.quantity}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{foodItem.price?.toFixed(2)}</p>
                    <p className="text-sm text-primary-600">
                      ₹{(foodItem.price * orderItem.quantity)?.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-600">
              {selectedItems.length} of {order?.orderItems?.length} items selected
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedItems(order?.orderItems?.map(item => item.id) || [])}
                className="text-sm"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedItems([])}
                className="text-sm"
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              Keep Order
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={cancelling || selectedItems.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelling ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Cancelling...</span>
                </div>
              ) : (
                `Cancel ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderTracking;