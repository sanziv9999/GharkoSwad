import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Stores from './pages/Stores';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import OTPVerification from './pages/auth/OTPVerification';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import ChefDashboard from './pages/chef/ChefDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import OrderTracking from './pages/delivery/OrderTracking';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import Offers from './pages/offers/Offers';
import Feed from './pages/feed/Feed';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" role="alert">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Something Went Wrong</h2>
            <p className="text-gray-600 mt-2">Please try refreshing the page or contact support.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ProtectedRoute component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status">
        <p className="text-lg text-gray-600" aria-live="polite">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role && allowedRole && user.role !== allowedRole) {
    return <Navigate to="/menu" replace state={{ from: location }} />;
  }

  return children;
};

// Layout wrapper component that conditionally shows Header/Footer
const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  
  // Routes that should not have Header/Footer (chef and delivery dashboards)
  const dashboardRoutes = ['/chef-dashboard', '/delivery-dashboard'];
  const isDashboardRoute = dashboardRoutes.includes(location.pathname);
  
  if (isDashboardRoute) {
    // Return just the content without Header/Footer for dashboard routes
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }
  
  // Return content with Header/Footer for all other routes
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <Router>
            <ErrorBoundary>
              <LayoutWrapper>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/stores" element={<Stores />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/otp" element={<OTPVerification />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-failure" element={<PaymentFailure />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                  <Route path='/delivery-dashboard' element={<DeliveryDashboard/>}/>
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRole={null}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chef-dashboard"
                    element={
                      <ProtectedRoute allowedRole="CHEF">
                        <ChefDashboard />
                      </ProtectedRoute>
                    }
                  />
                  {/* <Route
                    path="/delivery-dashboard"
                    element={
                      <ProtectedRoute allowedRole="DELIVERY">
                        <DeliveryDashboard />
                      </ProtectedRoute>
                    }
                  /> */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </LayoutWrapper>
            </ErrorBoundary>
          </Router>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;