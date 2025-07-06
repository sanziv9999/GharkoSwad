import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Clock, Phone, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Banner from '../components/ui/Banner';
import imagePathService from '../services/imageLocation/imagePath'; // Import image service

const Checkout = () => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    paymentMethod: 'cash',
    specialInstructions: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cartItems.length) {
      setError('Your cart is empty. Please add items before checking out.');
    } else {
      setError(null);
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

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call with a 2-second delay
      const orderData = {
        userId: user?.id || 'guest',
        items: cartItems.map(item => ({
          ...item,
          image: imagePathService.getImageUrl(item.imagePath || item.image) // Ensure image URL is included
        })),
        total: getTotalPrice() + 30, // Including delivery fee
        customerInfo: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          coordinates: [27.7172, 85.3240] // Default Kathmandu coordinates
        },
        paymentMethod: formData.paymentMethod,
        specialInstructions: formData.specialInstructions,
        deliveryFee: 30
      };

      await new Promise(resolve => setTimeout(resolve, 2000));
      const order = await createOrder(orderData); // Assuming createOrder returns an order object
      clearCart();
      
      showBanner('success', 'Order placed successfully!');
      
      setTimeout(() => {
        navigate(`/order-tracking/${order.id}`);
      }, 2000);

    } catch (error) {
      setError('Failed to place order. Please try again.');
      showBanner('error', 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deliveryFee = 30;
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;

  if (error && !cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
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
          {/* Order Form */}
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
                  { value: 'cash', label: 'Cash on Delivery', icon: '💵' },
                  { value: 'esewa', label: 'eSewa', icon: '📱' },
                  { value: 'khalti', label: 'Khalti', icon: '💳' }
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
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={imagePathService.getImageUrl(item.imagePath || item.image)} // Use image service
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => { e.target.src = '/placeholder-image.jpg'; }} // Fallback image
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
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

            <Button 
              onClick={handlePlaceOrder}
              className="w-full py-4 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Placing Order...' : `Place Order - ₹${total.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;