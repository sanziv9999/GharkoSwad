import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Banner from '../components/ui/Banner';

const OrderSuccess = () => {
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [orderDetails, setOrderDetails] = useState(null);
  
  // Use refs to prevent infinite loops
  const hasProcessedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleOrderSuccess = async () => {
      // Prevent multiple executions
      if (hasProcessedRef.current || !isMountedRef.current) {
        return;
      }
      
      hasProcessedRef.current = true;
      
      try {
        // Get order details from location state or URL params
        const orderData = location.state?.orderData;
        
        if (orderData && isMountedRef.current) {
          setOrderDetails(orderData);
        }
        
        // Clear the cart
        try {
          await clearCart();
        } catch (cartError) {
          console.warn('Failed to clear cart:', cartError);
        }
        
        if (isMountedRef.current) {
          showBanner('success', 'Order placed successfully! Your order has been confirmed.');
        }
      } catch (err) {
        console.error('Error processing order success:', err);
        if (isMountedRef.current) {
          showBanner('error', 'Failed to process order. Please check your order status.');
        }
      }
    };

    handleOrderSuccess();
  }, []); // Empty dependency array - only run once

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 5000);
  };

  const handleContinueShopping = () => {
    navigate('/menu');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {banner.show && (
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your order. We've received your order and it has been confirmed.
          </p>

          {/* Order Details */}
          {orderDetails && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">#{orderDetails.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">₹{orderDetails.amount?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">Cash on Delivery</span>
                </div>
                {orderDetails.deliveryLocation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Address:</span>
                    <span className="font-medium text-right max-w-xs">{orderDetails.deliveryLocation}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estimated Delivery */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-900">Estimated Delivery</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">25-35 minutes</p>
            <p className="text-sm text-blue-700 mt-1">We'll notify you when your order is ready!</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleContinueShopping}
              className="w-full py-3 text-lg font-semibold"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Continue Shopping
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleViewOrders}
                variant="outline"
                className="py-3"
              >
                View Orders
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="py-3"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              You will receive an SMS confirmation shortly. 
              Please have cash ready for payment upon delivery.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrderSuccess; 