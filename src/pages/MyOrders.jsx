import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Phone, Package, Truck, Home, CheckCircle, Calendar, DollarSign, ShoppingBag, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Banner from '../components/ui/Banner';
import Modal from '../components/ui/Modal';
import imagePathService from '../services/imageLocation/imagePath';

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancelOrder = (order) => {
    if (!order?.orderItems || order.orderItems.length === 0) {
      showBanner('error', 'No order items found to cancel');
      return;
    }
    
    setSelectedOrder(order);
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
    if (!selectedOrder) {
      showBanner('error', 'Please select an order to cancel');
      return;
    }

    try {
      setCancelling(true);
      const response = await apiService.cancelOrder(user.id, selectedOrder.orderId);
      
      if (response.status === 'success') {
        showBanner('success', response.message || 'Order cancelled successfully');
        
        // Update the orders list to reflect cancelled order
        setOrders(prev => prev.map(order => {
          if (order.orderId === selectedOrder.orderId) {
            return {
              ...order,
              status: 'CANCELLED'
            };
          }
          return order;
        }));
        
        setShowCancelModal(false);
        setSelectedItems([]);
        setSelectedOrder(null);
        
        // Refresh orders to get updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showBanner('error', response.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      showBanner('error', err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const canCancelOrder = (order) => {
    // Only allow cancellation for certain statuses
    const cancellableStatuses = ['PLACED', 'CONFIRMED', 'PREPARING'];
    return cancellableStatuses.includes(order?.status);
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
                          <div key={orderItem.orderItemId || index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
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
                                    <Badge key={`${orderItem.orderItemId}-${tag}-${tagIndex}`} variant="primary" size="sm">
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
                      {canCancelOrder(order) && (
                        <Button
                          variant="outline"
                          onClick={() => handleCancelOrder(order)}
                          className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel Order
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
              {selectedOrder?.orderItems?.map((orderItem, index) => {
                const foodItem = orderItem.foodItem;
                const isSelected = selectedItems.includes(orderItem.id);
                
                return (
                  <div 
                    key={orderItem.orderItemId || orderItem.id || `item-${index}`}
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
                {selectedItems.length} of {selectedOrder?.orderItems?.length} items selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItems(selectedOrder?.orderItems?.map(item => item.id) || [])}
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
    </div>
  );
};

export default MyOrders; 