import React from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../ui/Card';
import imagePathService from '../../services/imageLocation/imagePath';

const CartSidebar = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    isCartOpen, 
    setIsCartOpen,
    loading,
    error,
  } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    await updateQuantity(id, newQuantity);
  };

  const handleRemoveFromCart = async (id) => {
    await removeFromCart(id);
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-labelledby="cart-title">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} aria-hidden="true" />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-6 h-6 text-primary-500" />
              <h2 id="cart-title" className="text-xl font-bold text-gray-900">Your Cart</h2>
              {cartItems.length > 0 && (
                <span className="bg-primary-500 text-white text-sm px-2 py-1 rounded-full">
                  {cartItems.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Close cart"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Updating cart...</p>
              </div>
            )}
            {error && (
              <div className="text-center py-4 bg-red-100 text-red-600 rounded-md mb-4">
                {error}
              </div>
            )}
            {!loading && cartItems.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                Your cart is empty
              </div>
            )}
            {!loading && cartItems.length > 0 && (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id} className="p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start space-x-4">
                    <img
                        src={imagePathService.getImageUrl(item.imagePath || item.imageUrl || '/placeholder-image.jpg')}
                        alt={item.name || 'Unknown Item'}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name || 'Unknown Item'}</h3>
                        <p className="text-sm text-gray-600 mb-1">{item.chef || 'Unknown Chef'}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-primary-600">₹{(item.price || 0).toFixed(2)}</p>
                          <button
                            onClick={() => handleRemoveFromCart(item.foodId)}
                            className="p-1 hover:bg-red-100 rounded transition-colors duration-200"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleUpdateQuantity(item.foodId, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                          disabled={item.quantity <= 1 || loading}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-lg" aria-live="polite">{item.quantity || 0}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.foodId, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                          disabled={loading}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-primary-600">₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleCheckout} 
                  className="w-full py-3 text-lg font-semibold flex items-center justify-center space-x-2"
                  disabled={loading}
                  aria-label="Proceed to checkout"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button 
                  onClick={handleClearCart} 
                  variant="outline" 
                  className="w-full py-2 text-red-600 border-red-200 hover:bg-red-50"
                  disabled={loading}
                  aria-label="Clear cart"
                >
                  Clear Cart
                </Button>
              </div>
              
              {/* Continue Shopping */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/menu');
                }}
                className="w-full text-center text-primary-600 hover:text-primary-700 font-medium py-2 transition-colors duration-200"
                aria-label="Continue shopping"
                disabled={loading}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;