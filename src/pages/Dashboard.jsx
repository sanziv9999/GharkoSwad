import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Clock, Heart, User, Bell, MapPin, Star, TrendingUp, Calendar, CreditCard, Upload, X, ChefHat } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { apiService } from '../api/apiService';
import imagePathService from '../services/imageLocation/imagePath';

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  
  // Dynamic data state
  const [orders, setOrders] = useState([]);
  const [homeChefs, setHomeChefs] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    favorites: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || user?.phoneNumber || '',
    address: user?.address || user?.location || '',
    coordinate: user?.coordinate || '',
    description: user?.description || '',
    profilePicture: null
  });
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch dynamic data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch user's orders
        const ordersResponse = await apiService.getOrdersByUserId(user.id);
        const userOrders = ordersResponse?.data || [];
        setOrders(userOrders);
        
        // Fetch home chefs
        const chefsData = await apiService.getAllChefs();
        setHomeChefs(chefsData?.slice(0, 3) || []); // Show top 3 chefs
        
        // Calculate stats from orders
        const totalOrders = userOrders.length;
        const activeOrders = userOrders.filter(order => 
          ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP'].includes(order.status)
        ).length;
        const totalSpent = userOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        
        setDashboardStats({
          totalOrders,
          activeOrders,
          favorites: homeChefs.length, // You can adjust this based on your favorites logic
          totalSpent
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  // Reset form when modal opens
  const handleEditProfile = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || user?.phoneNumber || '',
      address: user?.address || user?.location || '',
      coordinate: user?.coordinate || '',
      description: user?.description || '',
      profilePicture: null
    });
    setPreviewImage(null);
    setUpdateMessage('');
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('coordinate', formData.coordinate);
      formDataToSend.append('description', formData.description);
      
      if (formData.profilePicture) {
        formDataToSend.append('profilePicture', formData.profilePicture);
      }

      const response = await apiService.updateUserProfile(user.id, formDataToSend);
      
      if (response.status === 'success') {
        // Update user in context with new data
        const updatedUser = {
          ...user,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          phoneNumber: formData.phone,
          address: formData.address,
          location: formData.address,
          coordinate: formData.coordinate,
          description: formData.description,
          ...(response.data?.profilePicture && { profilePicture: response.data.profilePicture })
        };
        setUser(updatedUser);
        
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setUpdateMessage('Profile updated successfully!');
        setTimeout(() => {
          setIsEditModalOpen(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateMessage(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Dynamic stats
  const statsData = [
    {
      icon: ShoppingBag,
      label: 'Total Orders',
      value: loading ? '-' : dashboardStats.totalOrders.toString(),
      change: '+12%', // You can calculate this based on historical data
      color: 'bg-primary-500'
    },
    {
      icon: Clock,
      label: 'Active Orders',
      value: loading ? '-' : dashboardStats.activeOrders.toString(),
      change: `+${dashboardStats.activeOrders}`,
      color: 'bg-orange-500'
    },
    {
      icon: ChefHat,
      label: 'Home Chefs',
      value: loading ? '-' : homeChefs.length.toString(),
      change: '+3',
      color: 'bg-green-500'
    },
    {
      icon: CreditCard,
      label: 'Total Spent',
      value: loading ? '-' : `NRs.${dashboardStats.totalSpent.toFixed(0)}`,
      change: '+18%',
      color: 'bg-blue-500'
    }
  ];

  // Format orders for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return 'success';
      case 'PICKED_UP': return 'primary';
      case 'PREPARING': case 'READY': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'secondary';
    }
  };

  // Check if order is trackable
  const isOrderTrackable = (status) => {
    return ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP'].includes(status);
  };

  // Navigation functions
  const handleTrackOrder = (orderId) => {
    console.log('Tracking order with ID:', orderId);
    navigate(`/order-tracking/${orderId}`);
  };

  const handleReorder = (order) => {
    // TODO: Implement reorder functionality
    console.log('Reordering:', order);
    // You can navigate to menu or stores page with the specific chef
  };

  const handleTrackActiveOrders = () => {
    const activeOrdersCount = dashboardStats.activeOrders;
    if (activeOrdersCount > 0) {
      navigate('/my-orders', { state: { filter: 'active' } });
    } else {
      navigate('/my-orders');
    }
  };

  // Recent orders (last 3 orders)
  const recentOrders = orders.slice(0, 3).map(order => ({
    id: order.orderId,
    restaurant: `Home Chef Order #${order.orderId}`,
    items: order.orderItems?.map(item => item.foodItem?.name || 'Food Item') || ['Order Items'],
    total: order.amount || 0,
    status: order.status || 'Unknown',
    statusColor: getStatusColor(order.status),
    date: formatDate(order.orderDate),
    time: formatTime(order.orderDate),
    rating: 4.8, // You can add rating to your order model later
    image: order.orderItems?.[0]?.foodItem?.imagePath 
      ? imagePathService.getImageUrl(order.orderItems[0].foodItem.imagePath)
      : 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=150'
  }));

  // Format home chefs for favorite restaurants section
  const favoriteRestaurants = homeChefs.map(chef => ({
    id: chef.id,
    name: chef.username,
    cuisine: chef.description || 'Homemade Specialties',
    rating: 4.7, // You can add rating to chef model later
    deliveryTime: '25-35 min',
    image: chef.profilePicture 
      ? imagePathService.getImageUrl(chef.profilePicture)
      : 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=200'
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Ready to order some delicious food?</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors duration-200">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700 font-medium">Kathmandu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsData.map((stat, index) => (
                <Card key={index} className="p-6" hover>
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">{stat.change}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                <Button variant="outline">View All</Button>
              </div>
              <div className="space-y-4">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="p-6 border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-2xl bg-gray-200 animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : recentOrders.length === 0 ? (
                  // Empty state
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6">Start exploring our amazing home chefs!</p>
                    <div className="flex space-x-3 justify-center">
                      <Button onClick={() => navigate('/stores')}>
                        Browse Home Chefs
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/my-orders')}>
                        View Order History
                      </Button>
                    </div>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                  <Card key={order.id} className="p-6 border border-gray-100" hover>
                    <div className="flex items-center space-x-4">
                      <img
                        src={order.image}
                        alt={order.restaurant}
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{order.restaurant}</h3>
                            <p className="text-gray-600 mb-2">{order.items.join(', ')}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{order.date}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{order.time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">NRs.{order.total}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{order.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Badge variant={order.statusColor}>
                            {order.status}
                          </Badge>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReorder(order)}
                            >
                              Reorder
                            </Button>
                            {isOrderTrackable(order.status) && (
                              <Button 
                                size="sm"
                                onClick={() => handleTrackOrder(order.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                Track Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                <p className="text-gray-600 mb-2">{user?.email}</p>
                <Badge variant="success" className="mb-4">Premium Member</Badge>
                <Button className="w-full" onClick={handleEditProfile}>
                  Edit Profile
                </Button>
              </div>
            </Card>

            {/* Home Chefs */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Top Home Chefs</h3>
                <ChefHat className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-4">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                      </div>
                    </div>
                  ))
                ) : favoriteRestaurants.length === 0 ? (
                  // Empty state
                  <div className="text-center py-8">
                    <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-gray-600 mb-1">No chefs available</h4>
                    <p className="text-xs text-gray-500">Check back later for amazing home chefs!</p>
                  </div>
                ) : (
                  favoriteRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{restaurant.name}</h4>
                      <p className="text-gray-600 text-xs">{restaurant.cuisine}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">{restaurant.rating}</span>
                        </div>
                        <span className="text-xs text-gray-500">{restaurant.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { 
                    label: 'Browse Home Chefs', 
                    icon: ChefHat, 
                    onClick: () => navigate('/stores')
                  },
                  { 
                    label: `Track Orders (${dashboardStats.activeOrders})`, 
                    icon: Clock, 
                    onClick: handleTrackActiveOrders,
                    disabled: dashboardStats.activeOrders === 0
                  },
                  { 
                    label: 'Reorder Favorite', 
                    icon: ShoppingBag,
                    onClick: () => {
                      if (orders.length > 0) {
                        handleReorder(orders[0]);
                      } else {
                        navigate('/stores');
                      }
                    }
                  },
                  { 
                    label: 'Order History', 
                    icon: Calendar, 
                    onClick: () => navigate('/my-orders')
                  }
                ].map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg transition-colors duration-200 ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <action.icon className={`w-5 h-5 ${action.disabled ? 'text-gray-300' : 'text-gray-400'}`} />
                      <span>{action.label}</span>
                    </div>
                    {action.label.includes('Track Orders') && dashboardStats.activeOrders > 0 && (
                      <Badge variant="primary" className="text-xs px-2 py-1">
                        {dashboardStats.activeOrders}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <Input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="coordinate" className="block text-sm font-medium text-gray-700">Coordinates</label>
            <Input
              type="text"
              id="coordinate"
              name="coordinate"
              value={formData.coordinate}
              onChange={handleInputChange}
              placeholder="e.g. 27.7172, 85.3240"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Tell us about yourself..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
           <div>
             <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture</label>
            <Input
              type="file"
              id="profilePicture"
              name="profilePicture"
              onChange={handleFileChange}
              className="mt-1"
            />
            {previewImage && (
              <img src={previewImage} alt="Preview" className="mt-2 w-24 h-24 rounded-full object-cover" />
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
          {updateMessage && (
            <p className={`text-center ${updateMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {updateMessage}
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;