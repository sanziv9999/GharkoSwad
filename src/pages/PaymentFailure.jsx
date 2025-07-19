import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, Home, RefreshCw, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Banner from '../components/ui/Banner';

const PaymentFailure = () => {
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [failureReason, setFailureReason] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dataParam = searchParams.get('data');

    if (dataParam) {
      try {
        const decodedData = atob(dataParam);
        const paymentData = JSON.parse(decodedData);
        console.log('Payment failure data:', paymentData);
        
        // Set failure reason based on payment data
        if (paymentData.status === 'FAILED') {
          setFailureReason('Payment was declined or failed to process.');
        } else if (paymentData.status === 'CANCELLED') {
          setFailureReason('Payment was cancelled by the user.');
        } else {
          setFailureReason('Payment could not be completed. Please try again.');
        }
      } catch (err) {
        console.error('Error processing payment failure:', err);
        setFailureReason('Payment could not be completed. Please try again.');
      }
    } else {
      setFailureReason('Payment could not be completed. Please try again.');
    }

    showBanner('error', 'Payment failed. Your cart items are still available.');
  }, [location.search]);

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 5000);
  };

  const handleRetryPayment = () => {
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/menu');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewCart = () => {
    navigate('/checkout');
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
          {/* Failure Icon */}
          <div className="mb-6">
            <XCircle className="w-20 h-20 text-red-500 mx-auto" />
          </div>

          {/* Failure Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Failed
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            {failureReason}
          </p>
          <p className="text-gray-500 mb-8">
            Don't worry, your cart items are still saved and you can try again.
          </p>

          {/* Cart Items Summary */}
          {cartItems.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Cart ({cartItems.length} items)
              </h3>
              <div className="space-y-2">
                {cartItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-gray-700">{item.name} x{item.quantity}</span>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <p className="text-sm text-gray-500 mt-2">
                    +{cartItems.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleRetryPayment}
              className="w-full py-3 text-lg font-semibold"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Payment Again
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleViewCart}
                variant="outline"
                className="py-3"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                View Cart
              </Button>
              <Button
                onClick={handleContinueShopping}
                variant="outline"
                className="py-3"
              >
                Continue Shopping
              </Button>
            </div>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full py-2"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-500 mb-3">
              If you're experiencing issues with payment, please check:
            </p>
            <ul className="text-sm text-gray-500 text-left space-y-1">
              <li>• Your internet connection is stable</li>
              <li>• Your payment method has sufficient funds</li>
              <li>• Your card details are entered correctly</li>
              <li>• Your bank hasn't blocked the transaction</li>
            </ul>
            <p className="text-sm text-gray-500 mt-3">
              For further assistance, please contact our support team.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentFailure; 