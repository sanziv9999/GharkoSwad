import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag, Clock, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Banner from '../components/ui/Banner';

const PaymentSuccess = () => {
  const { clearCart } = useCart();
  const { verifyEsewaPayment, loading, error } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [orderDetails, setOrderDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false);
  const isMounted = useRef(true);
  
  // Track processing state changes
  useEffect(() => {
    console.log('isProcessing state changed to:', isProcessing);
  }, [isProcessing]);
  
  // Store functions in refs to avoid dependency issues
  const verifyEsewaPaymentRef = useRef(verifyEsewaPayment);
  const clearCartRef = useRef(clearCart);
  
  // Update refs when functions change
  useEffect(() => {
    verifyEsewaPaymentRef.current = verifyEsewaPayment;
    clearCartRef.current = clearCart;
  }, [verifyEsewaPayment, clearCart]);
  
  // Cleanup on unmount
  useEffect(() => {
    // Reset processing flags on mount
    hasProcessed.current = false;
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('hasProcessed.current:', hasProcessed.current);
    console.log('isProcessing:', isProcessing);
    console.log('location.search:', location.search);
    
    // Prevent multiple executions
    if (hasProcessed.current || isProcessing === false) {
      console.log('Skipping processing - already processed or not processing');
      return;
    }
    
    // Only process if there's a search parameter
    if (!location.search) {
      console.log('No search parameters, setting processing to false');
      if (isMounted.current) {
        setIsProcessing(false);
      }
      return;
    }
    
    console.log('Starting payment processing...');
    hasProcessed.current = true;
    
    // Add timeout to prevent infinite processing
    const timeoutId = setTimeout(async () => {
      if (isMounted.current && isProcessing) {
        // Check for recent orders as fallback
        const recentOrder = await checkForRecentOrders();
        
        if (recentOrder) {
          if (isMounted.current) {
            setOrderDetails(recentOrder);
            showBanner('success', 'Payment successful! Your order has been confirmed.');
            try {
              await clearCartRef.current();
            } catch (cartError) {
              console.warn('Failed to clear cart:', cartError);
            }
            setIsProcessing(false);
          }
        } else {
          if (isMounted.current) {
            showBanner('error', 'Payment verification timed out. Please check your order status or contact support.');
            setIsProcessing(false);
          }
        }
      }
    }, 30000); // 30 second timeout
    
    const handlePaymentSuccess = async () => {
      console.log('=== Payment Success Processing Started ===');
      console.log('Full URL:', window.location.href);
      console.log('Location search:', location.search);
      const searchParams = new URLSearchParams(location.search);
      const dataParam = searchParams.get('data');
      console.log('Data param exists:', !!dataParam);
      console.log('Data param length:', dataParam?.length || 0);

      if (dataParam) {
        try {
          console.log('Processing data parameter...');
          // Decode the Base64 string and then parse as JSON
          const decodedData = atob(dataParam); // Decode Base64
          console.log('Decoded data length:', decodedData.length);
          const paymentData = JSON.parse(decodedData); // Parse as JSON
          console.log('Payment data keys:', Object.keys(paymentData));

          // Check for alternative field names that eSewa might use
          const transactionUuid = paymentData.transaction_uuid || paymentData.transactionUuid || paymentData.txn_uuid || paymentData.transaction_id;
          const totalAmount = paymentData.total_amount || paymentData.totalAmount || paymentData.amount || paymentData.paid_amount;
          
          console.log('Extracted values:', { transactionUuid, totalAmount, status: paymentData.status });
          
          if (!transactionUuid || !totalAmount) {
            throw new Error(`Missing transaction_uuid or total_amount in eSewa response. Available fields: ${Object.keys(paymentData).join(', ')}`);
          }

          if (paymentData.status === 'COMPLETE') {
            console.log('Payment status is COMPLETE, proceeding with verification...');
            const amount = parseFloat(totalAmount);
            
            // Validate that we have valid values
            if (!transactionUuid || isNaN(amount) || amount <= 0) {
              throw new Error(`Invalid payment data: transactionUuid=${transactionUuid}, amount=${amount}`);
            }
            
            console.log('Calling verifyEsewaPayment with:', { transactionUuid, amount });
            
            // Add timeout to verification call
            const verificationPromise = verifyEsewaPaymentRef.current(transactionUuid, amount);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Verification timeout')), 15000)
            );
            
            const verificationResponse = await Promise.race([verificationPromise, timeoutPromise]);
            console.log('Verification response received:', verificationResponse);
            console.log('Verification response type:', typeof verificationResponse);
            console.log('Verification response keys:', Object.keys(verificationResponse || {}));
            console.log('Verification response status:', verificationResponse?.status);

            if (!verificationResponse) {
              console.error('Verification response is null or undefined');
              if (isMounted.current) {
                showBanner('error', 'Payment verification failed: No response received from server.');
                setIsProcessing(false);
              }
              return;
            }

            if (verificationResponse.status === 'success') {
              console.log('Verification successful, clearing cart...');
              try {
                // Clear the cart after successful payment
                await clearCartRef.current();
                console.log('Cart cleared successfully');
              } catch (cartError) {
                console.warn('Failed to clear cart:', cartError);
                // Continue with success flow even if cart clearing fails
              }
              
              // Set order details for display
              if (isMounted.current) {
                console.log('Setting order details and showing success...');
                setOrderDetails(verificationResponse.data);
                showBanner('success', 'Payment successful! Your order has been confirmed.');
                console.log('About to set isProcessing to false...');
                setIsProcessing(false);
                console.log('isProcessing set to false');
              } else {
                console.log('Component not mounted, skipping state updates');
              }
            } else {
              console.log('Verification failed:', verificationResponse);
              if (isMounted.current) {
                showBanner('error', verificationResponse.message || 'Payment verification failed. Please contact support.');
                setIsProcessing(false);
              }
            }
          } else {
            console.log('Payment status is not COMPLETE:', paymentData.status);
            if (isMounted.current) {
              showBanner('error', 'Payment was not completed.');
              setIsProcessing(false);
            }
          }
        } catch (err) {
          console.error('Error in payment processing:', err);
          let errorMessage = 'Failed to process payment response: ' + err.message;
          
          // Provide more specific error messages
          if (err.message.includes('transactionUuid and amount are required')) {
            errorMessage = 'Payment verification failed: Invalid payment data received from eSewa. Please contact support.';
          } else if (err.message.includes('Missing transaction_uuid')) {
            errorMessage = 'Payment verification failed: Incomplete payment data received. Please contact support.';
          }
          
          if (isMounted.current) {
            showBanner('error', errorMessage);
            setIsProcessing(false);
          }
        }
      } else {
        // No payment data, show generic success message
        console.log('No payment data found, showing generic success message');
        if (isMounted.current) {
          showBanner('success', 'Payment successful! Your order has been confirmed.');
          try {
            await clearCartRef.current();
          } catch (cartError) {
            console.warn('Failed to clear cart:', cartError);
            // Continue with success flow even if cart clearing fails
          }
          setIsProcessing(false);
        }
      }
      
      // Clear timeout since processing is complete
      clearTimeout(timeoutId);
    };

    console.log('Calling handlePaymentSuccess...');
    handlePaymentSuccess();
    
    // Cleanup function
    return () => {
      console.log('Cleanup function called');
      clearTimeout(timeoutId);
      hasProcessed.current = false;
      isMounted.current = false;
    };
  }, [location.search]); // Remove verifyEsewaPayment and clearCart from dependencies

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 5000);
  };

  const handleTrackOrder = () => {
    if (orderDetails?.id) {
      navigate(`/order-tracking/${orderDetails.id}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleContinueShopping = () => {
    navigate('/menu');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const checkForRecentOrders = async () => {
    try {
      if (user?.id) {
        const result = await apiService.get(`/orders/user/${user.id}`, localStorage.getItem('token'));
        const orders = result.data || [];
        const recentOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          const now = new Date();
          const diffInMinutes = (now - orderDate) / (1000 * 60);
          return diffInMinutes < 10; // Orders from last 10 minutes
        });
        
        if (recentOrders.length > 0) {
          return recentOrders[0]; // Return the most recent order
        }
      }
    } catch (err) {
      console.warn('Failed to check for recent orders:', err);
    }
    return null;
  };

  if (isProcessing) {
    console.log('Rendering processing screen, isProcessing:', isProcessing);
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-600 mb-4">Please wait while we verify your payment...</p>
          
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-500">
            Processing: {isProcessing.toString()}
          </div>
          
          {/* Temporary debug button */}
          <Button 
            onClick={async () => {
              console.log('Manual continue clicked');
              const recentOrder = await checkForRecentOrders();
              if (recentOrder) {
                setOrderDetails(recentOrder);
              }
              setIsProcessing(false);
              showBanner('success', 'Payment successful! Your order has been confirmed.');
            }}
            className="mt-4"
            variant="outline"
          >
            Continue (Debug)
          </Button>
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your order. We've received your payment and your order has been confirmed.
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
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium">NRs.{orderDetails.amount?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{orderDetails.paymentMethod || 'eSewa'}</span>
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
              onClick={handleTrackOrder}
              className="w-full py-3 text-lg font-semibold"
              disabled={loading}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Track My Order
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleContinueShopping}
                variant="outline"
                className="py-3"
                disabled={loading}
              >
                Continue Shopping
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="py-3"
                disabled={loading}
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
              If you have any questions, please contact our support team.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess; 