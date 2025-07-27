import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, CreditCard, Clock, Phone, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Banner from '../components/ui/Banner';
import imagePathService from '../services/imageLocation/imagePath';
import CryptoJS from 'crypto-js';

const Checkout = () => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { createOrder, verifyEsewaPayment, loading, error } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    name: user?.username || '',
    phone: user?.phone || '',
    address: user?.address || '',
    paymentMethod: 'CASH_ON_DELIVERY',
    specialInstructions: ''
  });
  const [deliveryCoordinates, setDeliveryCoordinates] = useState('[27.7172, 85.3240]');

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      name: user?.username || '',
      phone: user?.phone || '',
      address: user?.address || ''
    }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDeliveryCoordinates(`[${latitude}, ${longitude}]`);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          setBanner({ show: true, type: 'warning', message: 'Could not fetch live location, using default coordinates.' });
        }
      );
    }
    // Payment success handling is now done in PaymentSuccess component
  }, [user, location]);

  useEffect(() => {
    if (!cartItems.length) {
      setBanner({ show: true, type: 'error', message: 'Your cart is empty. Please add items before checking out.' });
    } else {
      setBanner(prev => ({ ...prev, show: false }));
    }
  }, [cartItems]);

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateTransactionUuid = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uuid = '';
    for (let i = 0; i < 25; i++) {
      uuid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uuid;
  };

  const generateSignature = (data, secretKey) => {
    return CryptoJS.HmacSHA256(data, secretKey).toString(CryptoJS.enc.Base64);
  };

  const handleEsewaPayment = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      showBanner('error', 'Please fill in all required fields');
      return;
    }

    const totalAmount = Math.round((getTotalPrice() + 100) * 100) / 100;
    const transactionUuid = generateTransactionUuid();
    const productCode = 'EPAYTEST';
    const secretKey = '8gBm/:&EnhH.1/q';
    const signedFieldNames = 'total_amount,transaction_uuid,product_code';

    const data = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = generateSignature(data, secretKey);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
    form.target = '_blank';

    const addInput = (name, value) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    };

    addInput('amount', totalAmount);
    addInput('total_amount', totalAmount);
    addInput('tax_amount', '0');
    addInput('transaction_uuid', transactionUuid);
    addInput('product_code', productCode);
    addInput('product_service_charge', '0');
    addInput('product_delivery_charge', '0');
    addInput('success_url', 'http://localhost:5173/payment-success');
    addInput('failure_url', 'http://localhost:5173/payment-failure');
    addInput('signed_field_names', signedFieldNames);
    addInput('signature', signature);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    try {
      const orderData = {
        userId: user?.id || 'guest',
        items: cartItems.map(item => ({
          id: item.foodId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imagePath: item.imagePath || item.imageUrl,
        })),
        amount: totalAmount,
        paymentMethod: 'ESEWA',
        specialInstructions: formData.specialInstructions,
        deliveryFee: 100,
        transactionUuid: transactionUuid,
        deliveryLocation: formData.address,
        deliveryPhone: formData.phone,
        deliveryCoordinates: deliveryCoordinates,
      };
      await createOrder(orderData);
      showBanner('info', 'Redirecting to eSewa for payment...');
    } catch (err) {
      showBanner('error', err.message || 'Failed to initiate payment. Please try again.');
    }
  };



  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      showBanner('error', 'Please fill in all required fields');
      return;
    }
    if (cartItems.length === 0) {
      showBanner('error', 'Your cart is empty');
      return;
    }

    try {
      const totalAmount = Math.round((getTotalPrice() + 100) * 100) / 100;
      const orderData = {
        userId: user?.id || 'guest',
        items: cartItems.map(item => ({
          id: item.foodId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imagePath: item.imagePath || item.imageUrl,
        })),
        amount: totalAmount,
        paymentMethod: formData.paymentMethod,
        specialInstructions: formData.specialInstructions,
        deliveryLocation: formData.address,
        deliveryPhone: formData.phone,
        deliveryCoordinates: deliveryCoordinates,
      };
      const order = await createOrder(orderData);
      try {
        await clearCart();
      } catch (cartError) {
        console.warn('Failed to clear cart:', cartError);
        // Continue with success flow even if cart clearing fails
      }
      
      // Redirect to order success page with order details
      navigate('/order-success', { 
        state: { 
          orderData: {
            id: order.id,
            amount: order.amount,
            deliveryLocation: order.deliveryLocation,
            paymentMethod: order.paymentMethod
          }
        } 
      });
    } catch (err) {
      showBanner('error', err.message || 'Failed to place order. Please try again.');
    }
  };

  const deliveryFee = 100;
  const subtotal = getTotalPrice();
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  if (banner.show && banner.type === 'error' && !cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">{banner.message}</p>
          <Button onClick={() => navigate('/menu')}>Go to Menu</Button>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-primary-500" />
                Customer Information
              </h2>
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                  <Input
                    label="Phone Number *"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+977-9841234567"
                    required
                  />
                </div>
                <Input
                  label="Delivery Address *"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your complete address"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleInputChange}
                    placeholder="Any special instructions for the chef or delivery..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="w-6 h-6 mr-2 text-primary-500" />
                Payment Method
              </h2>
              <div className="space-y-3">
                {[
                  { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', icon: '💵' },
                  { value: 'ESEWA', label: 'eSewa', icon: '📱' },
                ].map((method) => (
                  <label key={method.value} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={handleInputChange}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-2xl">{method.icon}</span>
                    <span className="ml-3 font-medium text-gray-900">{method.label}</span>
                  </label>
                ))}
                {formData.paymentMethod === 'ESEWA' && (
                  <div className="mt-4">
                    <Button onClick={handleEsewaPayment} disabled={loading} className="w-full py-3">
                      {loading ? 'Processing...' : 'Pay with eSewa'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={imagePathService.getImageUrl(item.imagePath || item.imageUrl)}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900">NRs.{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">NRs.{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">NRs.{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span>NRs.{total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-primary-500" />
                <span className="font-semibold text-gray-900">Estimated Delivery</span>
              </div>
              <p className="text-2xl font-bold text-primary-600">25-35 minutes</p>
              <p className="text-sm text-gray-600 mt-1">Based on your location</p>
            </Card>

            {formData.paymentMethod !== 'ESEWA' && (
              <Button
                onClick={handlePlaceOrder}
                className="w-full py-4 text-lg font-semibold"
                disabled={loading || !cartItems.length}
              >
                {loading ? 'Placing Order...' : `Place Order - NRs.${total.toFixed(2)}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
