import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Phone, Package, Truck, Home, CheckCircle, Calendar, DollarSign, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Banner from '../components/ui/Banner';
import imagePathService from '../services/imageLocation/imagePath';

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setError('Please log in to view your orders');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.get(`/orders/user/${user.id}/status`);
        console.log('Orders response:', response);
        
        if (response.data && Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to fetch orders');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  const getStatusInfo = (status) => {
    const statusMap = {
      'PLACED': { label: 'Order Placed', color: 'warning', icon: Package, bgColor: 'bg-yellow-50', textColor: 'text-yellow-800' },
      'CONFIRMED': { label: 'Confirmed', color: 'primary', icon: CheckCircle, bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
      'PREPARING': { label: 'Preparing', color: 'warning', icon: Package, bgColor: 'bg-orange-50', textColor: 'text-orange-800' },
      'READY': { label: 'Ready for Pickup', color: 'success', icon: CheckCircle, bgColor: 'bg-green-50', textColor: 'text-green-800' },
      'PICKED_UP': { label: 'Out for Delivery', color: 'primary', icon: Truck, bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
      'DELIVERED': { label: 'Delivered', color: 'success', icon: Home, bgColor: 'bg-green-50', textColor: 'text-green-800' },
      'CANCELLED': { label: 'Cancelled', color: 'error', icon: Package, bgColor: 'bg-red-50', textColor: 'text-red-800' },
    };
    return statusMap[status] || statusMap['PLACED'];
  };

  const getPaymentStatusInfo = (paymentStatus) => {
    const statusMap = {
      'PENDING': { label: 'Pending', color: 'warning', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800' },
      'PAID': { label: 'Paid', color: 'success', bgColor: 'bg-green-50', textColor: 'text-green-800' },
      'FAILED': { label: 'Failed', color: 'error', bgColor: 'bg-red-50', textColor: 'text-red-800' },
    };
    return statusMap[paymentStatus] || statusMap['PENDING'];
  };

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

  const handleTrackOrder = (orderId) => {
    navigate(`/order-tracking/${orderId}`);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Orders</h2>
          <p className="text-gray-600">Please wait while we fetch your orders...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 mt-1">Track and manage your food orders</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="success">
                📦 {orders.length} Orders
              </Badge>
              <Button onClick={() => navigate('/menu')} variant="outline">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Order More
              </Button>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start your culinary journey by placing your first order!</p>
            <Button onClick={() => navigate('/menu')}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Menu
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={order.orderId} className="overflow-hidden">
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${statusInfo.bgColor} rounded-full flex items-center justify-center`}>
                          <StatusIcon className={`w-6 h-6 ${statusInfo.textColor}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Order #{order.orderId}</h3>
                          <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={statusInfo.color} className="flex items-center space-x-2">
                          <StatusIcon className="w-4 h-4" />
                          <span>{statusInfo.label}</span>
                        </Badge>
                        <Badge variant={paymentStatusInfo.color}>
                          {paymentStatusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold">₹{order.amount?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Items:</span>
                        <span className="font-semibold">{order.orderItems?.length || 0}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Payment:</span>
                        <span className="font-semibold">{order.paymentMethod?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">{order.deliveryPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Ordered Items</h4>
                    <div className="space-y-4">
                      {order.orderItems?.map((orderItem, index) => {
                        const foodItem = orderItem.foodItem;
                        return (
                          <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <img
                              src={imagePathService.getImageUrl(foodItem.imagePath)}
                              alt={foodItem.name}
                              className="w-16 h-16 rounded-lg object-cover"
                              onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-semibold text-gray-900">{foodItem.name}</h5>
                                  <p className="text-sm text-gray-600 mb-1">{foodItem.description}</p>
                                  <p className="text-xs text-gray-500">by {foodItem.user?.username || 'Unknown Chef'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">₹{foodItem.price?.toFixed(2)}</p>
                                  <p className="text-sm text-gray-600">Qty: {orderItem.quantity}</p>
                                  <p className="text-sm font-semibold text-primary-600">
                                    ₹{(foodItem.price * orderItem.quantity)?.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              {foodItem.tags && foodItem.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {foodItem.tags.map((tag, tagIndex) => (
                                    <Badge key={tagIndex} variant="primary" size="sm">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                        <Button
                          onClick={() => handleTrackOrder(order.orderId)}
                          className="flex-1"
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Track Order
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => navigate('/menu')}
                        className="flex-1"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Order Again
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders; 