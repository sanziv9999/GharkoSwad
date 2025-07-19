import React, { useState, useEffect, useRef } from 'react';
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
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Banner from '../../components/ui/Banner';
import imagePathService from '../../services/imageLocation/imagePath';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (iconUrl, iconSize = [32, 32]) => {
  return L.icon({
    iconUrl,
    iconSize,
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Map update component for real-time updates
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
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
  
  const intervalRef = useRef(null);
  const mapRef = useRef(null);

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
  const deliveryCoords = order.deliveryCoordinates ? JSON.parse(order.deliveryCoordinates) : [27.7172, 85.3240];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {banner.show && (
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
              <p className="text-gray-600 mt-1">Order #{order.orderId} • {formatDate(order.orderDate)}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={statusInfo.color} className="flex items-center space-x-2 px-4 py-2">
                <StatusIcon className="w-4 h-4" />
                <span>{statusInfo.label}</span>
              </Badge>
              <Button variant="outline" onClick={() => navigate('/my-orders')}>
                Back to Orders
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Tracking Map */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Live Tracking</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live Updates</span>
                </div>
              </div>
              <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  center={deliveryCoords}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Customer Location */}
                  <Marker 
                    position={deliveryCoords}
                    icon={createCustomIcon('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png')}
                  >
                    <Popup>
                      <div className="text-center">
                        <Home className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                        <p className="font-semibold">Delivery Address</p>
                        <p className="text-sm">{order.deliveryLocation}</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Driver Location */}
                  {driverLocation && order.status !== 'DELIVERED' && (
                    <Marker 
                      position={driverLocation}
                      icon={createCustomIcon('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png')}
                    >
                      <Popup>
                        <div className="text-center">
                          <Truck className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                          <p className="font-semibold">Delivery Partner</p>
                          <p className="text-sm">Estimated Arrival: {estimatedTime}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Route Line */}
                  {driverLocation && order.status !== 'DELIVERED' && (
                    <Polyline
                      positions={[driverLocation, deliveryCoords]}
                      color="#3B82F6"
                      weight={4}
                      opacity={0.8}
                      dashArray="10, 10"
                    />
                  )}
                  
                  <MapUpdater center={deliveryCoords} zoom={15} />
                </MapContainer>
              </div>
            </Card>

            {/* Order Progress Timeline */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Progress</h2>
              <div className="space-y-6">
                {orderSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  const StepIcon = step.icon;
                  
                  return (
                    <div key={step.key} className="relative">
                      {/* Connection Line */}
                      {index < orderSteps.length - 1 && (
                        <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                          isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                        }`}></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Step Icon */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-primary-500 text-white shadow-lg' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <StepIcon className="w-6 h-6" />
                          )}
                        </div>
                        
                        {/* Step Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-lg font-semibold ${
                              isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {step.label}
                            </h3>
                            {step.time && (
                              <span className="text-sm text-gray-500">{step.time}</span>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${
                            isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {step.description}
                          </p>
                          
                          {/* Current step indicator */}
                          {isCurrent && (
                            <div className="mt-2 flex items-center space-x-2">
                              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-primary-600 font-medium">In Progress</span>
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
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-semibold">#{order.orderId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold text-lg">₹{order.amount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold">{order.paymentMethod?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Estimated Delivery */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Timer className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Estimated Delivery</h3>
                  <p className="text-sm text-gray-600">Your food will arrive soon</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600 mb-2">
                  {order.status === 'DELIVERED' ? 'Delivered!' : estimatedTime}
                </p>
                <p className="text-sm text-gray-600">
                  {order.status === 'DELIVERED' 
                    ? 'Thank you for your order!' 
                    : 'We\'ll notify you when it arrives'
                  }
                </p>
              </div>
            </Card>

            {/* Delivery Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Delivery Address</p>
                    <p className="text-sm text-gray-600">{order.deliveryLocation}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Contact Number</p>
                    <p className="text-sm text-gray-600">{order.deliveryPhone}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems?.map((orderItem, index) => {
                  const foodItem = orderItem.foodItem;
                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
            </Card>

            {/* Action Buttons */}
            <Card className="p-6">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Contact Support</span>
                </Button>
                <Button
                  onClick={() => navigate('/menu')}
                  className="w-full"
                >
                  Order Again
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;