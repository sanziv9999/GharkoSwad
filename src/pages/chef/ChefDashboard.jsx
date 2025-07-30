import React, { useState, useEffect } from 'react';
import { User, Plus, Edit, Trash2, Upload, Star, Clock, MapPin, Phone, Mail, ChefHat, TrendingUp, Package, DollarSign, MessageCircle, Image, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import imagePathService from '../../services/imageLocation/imagePath';
import { getImageUrl, getVideoUrl } from '../../services/imageLocation/imagePath';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Banner from '../../components/ui/Banner';

const ChefDashboard = () => {
  const { user, logout, setUser } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    location: user?.address || '',
    phoneNumber: user?.phone || '',
    profilePicture: null,
    profilePicturePreview: user?.profilePicture ? imagePathService.getImageUrl(user.profilePicture) : null,
    coordinate: '',
    description: user?.description || '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [foodItems, setFoodItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    originalPrice: '',
    available: true,
    image: null,
    preparationTime: '',
    tags: '',
    discountPercentage: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [feeds, setFeeds] = useState([]);
  const [showCreateFeed, setShowCreateFeed] = useState(false);
  const [newFeed, setNewFeed] = useState({
    type: 'text',
    content: '',
    image: null,
    video: null,
    recipe: {
      name: '',
      ingredients: '',
      instructions: '',
      cookingTime: '',
      serves: '',
    },
  });

  // Fetch and sync user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) return;
        const profile = await apiService.getUserProfile(userData.id);
        if (profile) {
          const updatedUser = {
            ...userData, // Use userData from localStorage instead of user from state
            ...profile,
            address: profile.location,
            phone: profile.phoneNumber,
            profilePicture: profile.profilePicture,
            description: profile.description,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setEditProfileData(prev => ({
            ...prev,
            email: profile.email || '',
            username: profile.username || '',
            location: profile.location || '',
            phoneNumber: profile.phoneNumber || '',
            profilePicture: null,
            profilePicturePreview: profile.profilePicture ? imagePathService.getImageUrl(profile.profilePicture) : null,
            coordinate: profile.coordinate || '',
            description: profile.description || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Optionally show error banner
      }
    };
    fetchUserProfile();
  }, []); // Empty dependency array - only run on mount

  // Helper for reverse geocoding
  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.display_name || `${lat},${lng}`;
    } catch {
      return `${lat},${lng}`;
    }
  };

  // Update fetchLiveLocation to use reverse geocoding
  const fetchLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await fetchAddressFromCoords(lat, lng);
          setEditProfileData((prev) => ({
            ...prev,
            location: address,
            coordinate: `${lat},${lng}`,
          }));
        },
        () => {
          console.error('Error getting location');
          // Optionally show error banner
        }
      );
    }
  };

  useEffect(() => {
    if (showEditProfile) {
      fetchLiveLocation();
    }
  }, [showEditProfile]);

  // Load food items on mount
  useEffect(() => {
    const loadFoodItems = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) return;
        const id = userData.id;
        const result = await apiService.getFoodsById(id);
        setFoodItems(result.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price || item.originalPrice * (1 - (item.discountPercentage || 0) / 100),
          originalPrice: item.originalPrice,
          available: item.available,
          image: imagePathService.getImageUrl(item.imagePath),
          preparationTime: item.preparationTime || '',
          tags: item.tags || [],
          discountPercentage: item.discountPercentage || 0,
          rating: 4.8, // Simulated rating
          orders: Math.floor(Math.random() * 100) + 10 // Simulated orders
        })));
      } catch (error) {
        console.error('Error loading food items:', error);
        // Optionally show error banner
      }
    };
    loadFoodItems();
  }, []);

  // Load orders on mount
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) return;
        const chefId = userData.id;
        const result = await apiService.getOrdersByChefId(chefId);
        if (result && result.data) {
          // Fetch customer details for each order
          const ordersWithCustomerData = await Promise.all(
            result.data.map(async (order) => {
              if (order.userId && !order.user) {
                try {
                  const customerData = await apiService.getUserProfile(order.userId);
                  return {
                    ...order,
                    user: customerData
                  };
                } catch (error) {
                  console.error(`Error fetching customer data for userId ${order.userId}:`, error);
                  return order; // Return original order if customer data fetch fails
                }
              }
              return order;
            })
          );
          setOrders(ordersWithCustomerData);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        // Optionally show error banner
      }
    };
    loadOrders();
  }, []);

  // Load feeds on mount
  useEffect(() => {
    const loadFeeds = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) return;
        const chefId = userData.id;
        const token = userData.token || user?.token;
        const result = await apiService.getFoodFeeds(token);
        if (result && Array.isArray(result)) {
          // Filter feeds by current chef (check chef.username or chef.id)
          const chefFeeds = result.filter(feed => 
            feed.chef && (
              feed.chef.username === userData.username || 
              feed.chef.id === chefId
            )
          );
          setFeeds(chefFeeds);
        }
      } catch (error) {
        console.error('Error loading feeds:', error);
      }
    };
    loadFeeds();
  }, [user?.token]);

  const getOrdersByStatus = (status) => {
    if (status === 'ALL') return orders;
    return orders.filter(order => order.status === status);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) return;
      const chefId = userData.id;
      const result = await apiService.updateOrderStatus(orderId, newStatus, chefId);
      if (result && result.data) {
        setOrders(prev => prev.map(order =>
          order.orderId === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      // Optionally show error banner
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      originalPrice: '',
      available: true,
      image: null,
      preparationTime: '',
      tags: '',
      discountPercentage: ''
    });
    setImagePreview(null);
  };

  const handleEditProfileChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files && files[0]) {
      setEditProfileData((prev) => ({
        ...prev,
        profilePicture: files[0],
        profilePicturePreview: URL.createObjectURL(files[0]),
      }));
    } else {
      setEditProfileData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      const userData = JSON.parse(localStorage.getItem('user'));
      const userId = userData?.id || user.id;
      formData.append('id', userId);
      formData.append('email', editProfileData.email);
      formData.append('username', editProfileData.username);
      formData.append('location', editProfileData.location);
      formData.append('phoneNumber', editProfileData.phoneNumber);
      formData.append('coordinate', editProfileData.coordinate);
      formData.append('description', editProfileData.description);
      if (editProfileData.profilePicture) {
        formData.append('profilePicture', editProfileData.profilePicture);
      }
      const result = await apiService.updateUserProfile(userId, formData);
      if (result && result.data) {
        const profile = await apiService.getUserProfile(userId);
        if (profile) {
          const updatedUser = {
            ...user,
            ...profile,
            address: profile.location,
            phone: profile.phoneNumber,
            profilePicture: profile.profilePicture,
            description: profile.description,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setEditProfileData(prev => ({
            ...prev,
            email: profile.email || '',
            username: profile.username || '',
            location: profile.location || '',
            phoneNumber: profile.phoneNumber || '',
            profilePicture: null,
            profilePicturePreview: profile.profilePicture ? imagePathService.getImageUrl(profile.profilePicture) : null,
            coordinate: profile.coordinate || '',
            description: profile.description || '',
          }));
        }
        setShowEditProfile(false);
        // Optionally show success banner
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Optionally show error banner
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
    if (type === 'file' && files && files[0]) {
      setImagePreview(URL.createObjectURL(files[0]));
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.originalPrice) return;
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || !userData.id) return;
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('originalPrice', formData.originalPrice);
    formDataToSend.append('available', formData.available.toString());
    if (formData.preparationTime) formDataToSend.append('preparationTime', formData.preparationTime);
    if (formData.tags) {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      formDataToSend.append('tags', tagsArray.join(','));
    }
    if (formData.discountPercentage) formDataToSend.append('discountPercentage', formData.discountPercentage);
    if (formData.image) formDataToSend.append('image', formData.image);
    formDataToSend.append('userId', userData.id);
    try {
      const result = await apiService.addFood(formDataToSend);
      setFoodItems(prev => [...prev, { ...result.data, rating: 4.8, orders: 0 }]);
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding food item:', error);
      // Optionally show error banner
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      originalPrice: item.originalPrice.toString(),
      available: item.available,
      image: null,
      preparationTime: item.preparationTime || '',
      tags: item.tags ? item.tags.join(', ') : '',
      discountPercentage: item.discountPercentage ? item.discountPercentage.toString() : ''
    });
    setImagePreview(item.image);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.originalPrice) return;
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('originalPrice', formData.originalPrice);
    formDataToSend.append('available', formData.available.toString());
    if (formData.preparationTime) formDataToSend.append('preparationTime', formData.preparationTime);
    if (formData.tags) {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      formDataToSend.append('tags', tagsArray.join(','));
    }
    if (formData.discountPercentage) formDataToSend.append('discountPercentage', formData.discountPercentage);
    if (formData.image) formDataToSend.append('image', formData.image);
    try {
      const result = await apiService.updateFood(editingItem, formDataToSend);
      setFoodItems(prev => prev.map(item => item.id === editingItem ? { ...result.data, id: item.id } : item));
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error updating food item:', error);
      // Optionally show error banner
    }
  };

  const handleDeleteItem = async (id) => {
    const itemToDelete = foodItems.find(item => item.id === id);
    if (window.confirm(`Are you sure you want to delete "${itemToDelete.name}"?`)) {
      try {
        await apiService.deleteFood(id);
        setFoodItems(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting food item:', error);
        // Optionally show error banner
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    resetForm();
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    resetForm();
  };

  const handleCreateFeed = async (e) => {
    e.preventDefault();
    if (!newFeed.content.trim()) {
      return;
    }

    const formData = new FormData();
    formData.append('chefId', user?.id || 'current-user');
    formData.append('content', newFeed.content);
    const typeMapping = {
      text: 'TEXT',
      image: 'IMAGE',
      video: 'VIDEO',
      recipe: 'RECIPE',
    };
    formData.append('type', typeMapping[newFeed.type.toLowerCase()] || 'TEXT');
    if (newFeed.image) formData.append('image', newFeed.image);
    if (newFeed.video) formData.append('video', newFeed.video);
    if (newFeed.type === 'recipe') {
      formData.append('recipeName', newFeed.recipe.name);
      formData.append('ingredients', newFeed.recipe.ingredients);
      formData.append('instructions', newFeed.recipe.instructions);
      formData.append('cookingTime', newFeed.recipe.cookingTime);
      formData.append('serves', newFeed.recipe.serves);
      formData.append('difficulty', newFeed.recipe.difficulty || 'Medium');
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const token = userData.token || user?.token;
      const response = await apiService.createFoodFeed(formData, token);
      setFeeds((prev) => [response.data, ...prev]);
      setNewFeed({
        type: 'text',
        content: '',
        image: null,
        video: null,
        recipe: { name: '', ingredients: '', instructions: '', cookingTime: '', serves: '' },
      });
      setShowCreateFeed(false);
    } catch (error) {
      console.error('Error creating feed:', error);
    }
  };

  const handleDeleteFeed = async (feedId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = userData.token || user?.token;
        await apiService.deleteFoodFeed(feedId, token);
        setFeeds((prev) => prev.filter(feed => feed.id !== feedId));
      } catch (error) {
        console.error('Error deleting feed:', error);
      }
    }
  };

  const toggleFeedAvailability = async (feedId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const userData = JSON.parse(localStorage.getItem('user'));
      const token = userData.token || user?.token;
      await apiService.updateFoodFeedStatus(feedId, newStatus, token);
      setFeeds((prev) => prev.map(feed => 
        feed.id === feedId ? { ...feed, status: newStatus } : feed
      ));
    } catch (error) {
      console.error('Error updating feed status:', error);
    }
  };

  const toggleAvailability = async (id) => {
    const item = foodItems.find(item => item.id === id);
    const newAvailability = !item.available;
    const formDataToSend = new FormData();
    formDataToSend.append('available', newAvailability.toString());
    try {
      const result = await apiService.updateFood(id, formDataToSend);
      setFoodItems(prev => prev.map(item => item.id === id ? { ...result.data, id: item.id } : item));
    } catch (error) {
      console.error('Error toggling availability:', error);
      // Optionally show error banner
    }
  };

  // Calculate dashboard stats
  const dashboardStats = {
    totalDishes: foodItems.length,
    totalOrders: orders.length,
    revenue: orders
      .filter(order => order.status !== 'CANCELLED') // Exclude cancelled orders from revenue
      .reduce((sum, order) => sum + (order.amount || 0), 0),
    avgRating: foodItems.length > 0 ? (foodItems.reduce((sum, item) => sum + item.rating, 0) / foodItems.length).toFixed(1) : '0.0'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Enhanced Header */}
      <header className="bg-white backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo.png" 
                alt="GharkoSwad Logo" 
                className="w-24 h-24 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Chef Dashboard
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.username}</p>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-gray-50 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  {editProfileData.profilePicturePreview ? (
                    <img 
                      src={editProfileData.profilePicturePreview} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {user?.username ? user.username.charAt(0).toUpperCase() : 'C'}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-900">{user?.username || 'Chef'}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">{user?.role || 'Chef'}</div>
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 top-16 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                        {editProfileData.profilePicturePreview ? (
                          <img 
                            src={editProfileData.profilePicturePreview} 
                            alt="Profile" 
                            className="w-16 h-16 rounded-2xl object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-xl">
                            {user?.username ? user.username.charAt(0).toUpperCase() : 'C'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{user?.username || 'Chef'}</h3>
                        <p className="text-sm text-emerald-600 font-medium uppercase tracking-wide">{user?.role || 'Chef'}</p>
                        <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      {user?.phone && (
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user?.address && (
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{user.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <Button
                        onClick={() => setShowEditProfile(true)}
                        variant="secondary"
                        className="w-full justify-start"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        onClick={logout}
                        variant="danger"
                        className="w-full justify-start"
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 p-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-green-200/50 shadow-lg">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'menu', label: 'Menu', icon: ChefHat },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'feeds', label: 'Feeds', icon: MessageCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Total Dishes</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">{dashboardStats.totalDishes}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ChefHat className="w-7 h-7 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200 shadow-lg hover:shadow-xl transition-shadow duration-300" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-semibold uppercase tracking-wide">Total Orders</p>
                    <p className="text-3xl font-bold text-emerald-900 mt-2">{dashboardStats.totalOrders}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200 shadow-lg hover:shadow-xl transition-shadow duration-300" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-600 text-sm font-semibold uppercase tracking-wide">Revenue</p>
                    <p className="text-3xl font-bold text-teal-900 mt-2">NRs.{dashboardStats.revenue.toFixed(0)}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200 shadow-lg hover:shadow-xl transition-shadow duration-300" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-600 text-sm font-semibold uppercase tracking-wide">Avg Rating</p>
                    <p className="text-3xl font-bold text-cyan-900 mt-2">{dashboardStats.avgRating}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Popular Dishes</h3>
                <div className="space-y-4">
                  {foodItems.slice(0, 3).map((item, index) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 rounded-xl bg-gray-50">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{item.rating}</span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{item.orders} orders</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">NRs.{item.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Orders</h3>
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.orderId} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div>
                        <h4 className="font-semibold text-gray-900">Order #{order.orderId}</h4>
                        <p className="text-sm text-gray-600">{order.user?.username}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          order.status === 'PLACED' ? 'warning' :
                          order.status === 'CONFIRMED' ? 'info' :
                          order.status === 'PREPARING' ? 'warning' :
                          order.status === 'READY' ? 'success' :
                          order.status === 'DELIVERED' ? 'success' :
                          'danger'
                        }>
                          {order.status}
                        </Badge>
                        <div className="text-sm font-semibold text-gray-900 mt-1">NRs.{order.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
                    <p className="text-gray-600 mt-1">Manage your dishes and their availability</p>
                </div>
                <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Dish
                </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {foodItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden group" hover>
                    <div className="relative">
                        <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="absolute top-4 left-4">
                        <Badge 
                            variant={item.available ? 'success' : 'danger'}
                            className={`shadow-lg backdrop-blur-sm ${!item.available ? 'bg-red-400 text-white' : ''}`}
                        >
                            {item.available ? 'Available' : 'Unavailable'}
                        </Badge>
                        </div>

                        {item.discountPercentage > 0 && (
                        <div className="absolute top-4 right-4">
                            <Badge variant="warning" className="shadow-lg backdrop-blur-sm">
                            {item.discountPercentage}% OFF
                            </Badge>
                        </div>
                        )}

                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex space-x-2">
                            <button 
                            onClick={() => handleEditItem(item)} 
                            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                            >
                            <Edit className="w-4 h-4 text-gray-700" />
                            </button>
                            <button 
                            onClick={() => handleDeleteItem(item.id)} 
                            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                            >
                            <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                        </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                        <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold text-gray-700">{item.rating}</span>
                        </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 text-sm line-clamp-2">{item.description}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-900">NRs.{item.price}</span>
                            {item.originalPrice && item.originalPrice !== item.price && (
                                                          <span className="text-sm text-gray-500 line-through">NRs.{item.originalPrice}</span>
                            )}
                        </div>
                        {item.preparationTime && (
                            <div className="flex items-center space-x-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{item.preparationTime}</span>
                            </div>
                        )}
                        </div>

                        {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {item.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} className="text-xs">
                                {tag}
                            </Badge>
                            ))}
                        </div>
                        )}

                        <div className="flex items-center justify-between">
                        <Button 
                            size="sm" 
                            onClick={() => toggleAvailability(item.id)}
                            className={`${item.available ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white border-0 font-medium`}
                        >
                            {item.available ? 'Disable' : 'Enable'}
                        </Button>
                        <span className="text-sm text-gray-500">{item.orders} orders</span>
                        </div>
                    </div>
                    </Card>
                ))}
                </div>

                {foodItems.length === 0 && (
                <Card className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ChefHat className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No dishes yet</h3>
                    <p className="text-gray-600 mb-6">Start building your menu by adding your first dish!</p>
                    <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your First Dish
                    </Button>
                </Card>
                )}
            </div>
            )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
              <p className="text-gray-600 mt-1">Track and manage your incoming orders</p>
            </div>

            <Card className="p-6">
              <div className="flex flex-wrap gap-3">
                {['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      orderStatusFilter === status
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status} {status !== 'ALL' && `(${getOrdersByStatus(status).length})`}
                  </button>
                ))}
              </div>
            </Card>

            <div className="space-y-6">
              {getOrdersByStatus(orderStatusFilter).length > 0 ? (
                getOrdersByStatus(orderStatusFilter).map((order) => (
                  <Card key={order.orderId} className="overflow-hidden" hover>
                    <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Order #{order.orderId}</h3>
                            <p className="text-sm text-gray-600">
                              {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Date not available'}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            order.status === 'PLACED' ? 'warning' :
                            order.status === 'CONFIRMED' ? 'info' :
                            order.status === 'PREPARING' ? 'warning' :
                            order.status === 'READY' ? 'success' :
                            'danger'
                          }
                          className="text-sm font-semibold px-4 py-2"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Customer Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="font-medium">{order.user?.username || 'N/A'}</div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{order.user?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{order.user?.phoneNumber || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Delivery Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="text-gray-900">{order.deliveryLocation || 'N/A'}</div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{order.deliveryPhone || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Payment Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="text-2xl font-bold text-emerald-600">
                              NRs.{order.amount ? order.amount.toFixed(2) : '0.00'}
                            </div>
                            <div className="text-gray-600">{order.paymentMethod || 'N/A'}</div>
                            <Badge variant="success" className="text-xs">
                              {order.paymentStatus || 'Paid'}
                            </Badge>
                          </div>
                        </div>
                                             </div>

                       {/* Order Items Section */}
                       {order.orderItems && order.orderItems.length > 0 && (
                         <div className="mt-6">
                           <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                             <ChefHat className="w-4 h-4 mr-2" />
                             Order Items ({order.orderItems.length})
                           </h4>
                           <div className="space-y-3">
                             {order.orderItems.map((item) => (
                               <div key={item.orderItemId} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                                 <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                   <img 
                                     src={imagePathService.getImageUrl(item.foodItem.imagePath)} 
                                     alt={item.foodItem.name}
                                     className="w-full h-full object-cover"
                                   />
                                 </div>
                                 <div className="flex-1">
                                   <h5 className="font-semibold text-gray-900">{item.foodItem.name}</h5>
                                   <p className="text-sm text-gray-600 line-clamp-1">{item.foodItem.description}</p>
                                   <div className="flex items-center space-x-2 mt-1">
                                     <span className="text-sm text-gray-500">NRs.{item.foodItem.price}</span>
                                     {item.foodItem.preparationTime && (
                                       <>
                                         <span className="text-gray-400">•</span>
                                         <span className="text-sm text-gray-500">{item.foodItem.preparationTime}</span>
                                       </>
                                     )}
                                   </div>
                                 </div>
                                 <div className="text-right">
                                   <div className="text-lg font-bold text-gray-900">x{item.quantity}</div>
                                   <div className="text-sm text-gray-600">
                                     NRs.{(item.foodItem.price * item.quantity).toFixed(2)}
                                   </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                        {order.status === 'PLACED' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.orderId, 'CONFIRMED')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Confirm Order
                          </Button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.orderId, 'PREPARING')}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'PREPARING' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.orderId, 'READY')}
                            variant="success"
                          >
                            Mark as Ready
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No {orderStatusFilter.toLowerCase()} orders
                  </h3>
                  <p className="text-gray-600">
                    {orderStatusFilter === 'ALL' 
                      ? 'Orders will appear here when customers place them!'
                      : `No ${orderStatusFilter.toLowerCase()} orders at the moment.`
                    }
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Feeds Tab */}
        {activeTab === 'feeds' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Food Feeds</h2>
                <p className="text-gray-600 mt-1">Share your culinary creations and recipes with your followers!</p>
              </div>
              <Button onClick={() => setShowCreateFeed(true)} className="shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Create New Feed
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {feeds.map((feed) => (
                <Card key={feed.id} className="overflow-hidden group" hover>
                  <div className="relative">
                    {feed.type === 'IMAGE' && feed.imagePath && (
                      <img 
                        src={getImageUrl(feed.imagePath)} 
                        alt={feed.content} 
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" 
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                        }}
                      />
                    )}
                    {feed.type === 'VIDEO' && feed.videoPath && (
                      <video 
                        src={getVideoUrl(feed.videoPath)} 
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" 
                        onError={(e) => {
                          console.error('Video loading error:', e);
                          e.target.style.display = 'none';
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'w-full h-56 bg-gray-200 flex items-center justify-center';
                          errorDiv.innerHTML = '<p class="text-gray-500">Video not available</p>';
                          e.target.parentNode.appendChild(errorDiv);
                        }}
                      />
                    )}
                    {feed.type === 'TEXT' && (
                      <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <MessageCircle className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {feed.type === 'RECIPE' && (
                      <div className="w-full h-56 bg-gradient-to-br from-orange-100 to-yellow-200 flex items-center justify-center">
                        <ChefHat className="w-12 h-12 text-orange-500" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-4 left-4">
                      <Badge 
                        variant={feed.status === 'ACTIVE' ? 'success' : 'danger'}
                        className={`shadow-lg backdrop-blur-sm ${feed.status === 'INACTIVE' ? 'bg-red-400 text-white' : ''}`}
                      >
                        {feed.status || 'ACTIVE'}
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleDeleteFeed(feed.id)} 
                          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                        <button 
                          onClick={() => toggleFeedAvailability(feed.id, feed.status)} 
                          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                        >
                          <MessageCircle className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1 mb-2">{feed.content}</h3>
                    
                    {feed.type === 'RECIPE' && feed.recipe && (
                      <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">{feed.recipe.name}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div><strong>Time:</strong> {feed.recipe.cookingTime}</div>
                          <div><strong>Serves:</strong> {feed.recipe.serves}</div>
                          <div><strong>Difficulty:</strong> {feed.recipe.difficulty}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" />
                      {feed.createdAt ? new Date(feed.createdAt).toLocaleDateString() : 'Date not available'}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {feeds.length === 0 && (
              <Card className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No feeds yet</h3>
                <p className="text-gray-600 mb-6">Start sharing your culinary journey with your followers!</p>
                <Button onClick={() => setShowCreateFeed(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Feed
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Enhanced Edit Profile Modal */}
        {showEditProfile && (
          <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile" size="lg">
            <form onSubmit={handleEditProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Email" 
                  name="email" 
                  type="email"
                  value={editProfileData.email} 
                  onChange={handleEditProfileChange} 
                  required 
                  icon={<Mail className="w-4 h-4 text-gray-400" />}
                />
                <Input 
                  label="Username" 
                  name="username" 
                  value={editProfileData.username} 
                  onChange={handleEditProfileChange} 
                  required 
                  icon={<User className="w-4 h-4 text-gray-400" />}
                />
              </div>

              <Input 
                label="Location" 
                name="location" 
                value={editProfileData.location} 
                onChange={handleEditProfileChange} 
                readOnly 
                icon={<MapPin className="w-4 h-4 text-gray-400" />}
              />

              <Input 
                label="Phone Number" 
                name="phoneNumber" 
                type="tel"
                value={editProfileData.phoneNumber} 
                onChange={handleEditProfileChange} 
                icon={<Phone className="w-4 h-4 text-gray-400" />}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture</label>
                <div className="flex items-center space-x-4">
                  <input 
                    type="file" 
                    name="profilePicture" 
                    accept="image/*" 
                    onChange={handleEditProfileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {editProfileData.profilePicturePreview && (
                    <img 
                      src={editProfileData.profilePicturePreview} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200" 
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={editProfileData.description}
                  onChange={handleEditProfileChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Tell customers about yourself and your cooking style..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  type="submit" 
                  loading={isUpdatingProfile}
                  className="flex-1"
                >
                  {isUpdatingProfile ? 'Saving Changes...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Enhanced Add/Edit Food Item Modal */}
        {(showAddForm || editingItem) && (
          <Modal 
            isOpen={showAddForm || !!editingItem} 
            onClose={editingItem ? handleCancelEdit : handleCancelAdd} 
            title={editingItem ? 'Edit Dish' : 'Add New Dish'}
            size="lg"
          >
            <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Dish Name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="e.g., Truffle Pasta"
                />
                <Input 
                  label="Price (NRs.)" 
                  name="originalPrice" 
                  type="number" 
                  value={formData.originalPrice} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Describe your dish..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Preparation Time" 
                  name="preparationTime" 
                  value={formData.preparationTime} 
                  onChange={handleInputChange} 
                  placeholder="e.g., 25 min"
                  icon={<Clock className="w-4 h-4 text-gray-400" />}
                />
                <Input 
                  label="Discount (%)" 
                  name="discountPercentage" 
                  type="number" 
                  value={formData.discountPercentage} 
                  onChange={handleInputChange} 
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              <Input 
                label="Tags" 
                name="tags" 
                value={formData.tags} 
                onChange={handleInputChange} 
                placeholder="e.g., Italian, Pasta, Vegetarian (comma separated)"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dish Image</label>
                <div className="space-y-4">
                  <input 
                    type="file" 
                    name="image" 
                    accept="image/*" 
                    onChange={handleInputChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200" 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="available"
                  name="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="available" className="text-sm font-medium text-gray-900">
                  Available for orders
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button type="submit" className="flex-1">
                  {editingItem ? 'Update Dish' : 'Add Dish'}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={editingItem ? handleCancelEdit : handleCancelAdd}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Enhanced Create Feed Modal */}
        {showCreateFeed && (
          <Modal 
            isOpen={showCreateFeed} 
            onClose={() => setShowCreateFeed(false)} 
            title="Create New Food Feed"
            size="lg"
          >
            <form onSubmit={handleCreateFeed} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Feed Type</label>
                <select
                  value={newFeed.type}
                  onChange={(e) => setNewFeed(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="text">Text Post</option>
                  <option value="image">Image Post</option>
                  <option value="video">Video Post</option>
                  <option value="recipe">Recipe Post</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content <span className="text-red-500">*</span></label>
                <textarea
                  value={newFeed.content}
                  onChange={(e) => setNewFeed(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Share your culinary story, tips, or recipe..."
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {newFeed.content.length}/500 characters
                  </span>
                  {newFeed.content.length > 450 && (
                    <span className="text-xs text-orange-500">
                      {500 - newFeed.content.length} characters remaining
                    </span>
                  )}
                </div>
              </div>

              {(newFeed.type === 'image' || newFeed.type === 'video') && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    {newFeed.type === 'image' ? 'Upload Image' : 'Upload Video'} <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors duration-200">
                    <input 
                      type="file" 
                      accept={newFeed.type === 'image' ? 'image/*' : 'video/*'}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Check file size (5MB for images, 50MB for videos)
                          const maxSize = newFeed.type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
                          if (file.size > maxSize) {
                            console.error(`File too large. Maximum size: ${newFeed.type === 'image' ? '5MB' : '50MB'}`);
                            return;
                          }
                          setNewFeed(prev => ({ ...prev, [newFeed.type]: file }));
                        }
                      }}
                      className="hidden"
                      id={`file-upload-${newFeed.type}`}
                    />
                    <label htmlFor={`file-upload-${newFeed.type}`} className="cursor-pointer">
                      {newFeed.type === 'image' ? (
                        <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      ) : (
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      )}
                      <div className="text-gray-600">
                        <span className="font-medium text-emerald-600 hover:text-emerald-500">
                          Click to upload
                        </span>{' '}
                        or drag and drop
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {newFeed.type === 'image' 
                          ? 'PNG, JPG, GIF up to 5MB' 
                          : 'MP4, AVI, MOV up to 50MB'
                        }
                      </div>
                    </label>
                  </div>
                  {newFeed[newFeed.type] && (
                    <div className="relative">
                      {newFeed.type === 'image' ? (
                        <img 
                          src={URL.createObjectURL(newFeed[newFeed.type])} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-xl border-2 border-gray-200" 
                        />
                      ) : (
                        <video 
                          src={URL.createObjectURL(newFeed[newFeed.type])} 
                          controls 
                          className="w-full h-48 object-cover rounded-xl border-2 border-gray-200" 
                        />
                      )}
                      <button
                        onClick={() => setNewFeed(prev => ({ ...prev, [newFeed.type]: null }))}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

              {newFeed.type === 'recipe' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <ChefHat className="w-5 h-5 mr-2 text-emerald-600" />
                    Recipe Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Recipe Name" 
                      name="recipeName" 
                      value={newFeed.recipe.name} 
                      onChange={(e) => setNewFeed(prev => ({ ...prev, recipe: { ...prev.recipe, name: e.target.value } }))} 
                      required 
                      placeholder="e.g., Classic Italian Pizza"
                    />
                    <Input 
                      label="Cooking Time" 
                      name="cookingTime" 
                      value={newFeed.recipe.cookingTime} 
                      onChange={(e) => setNewFeed(prev => ({ ...prev, recipe: { ...prev.recipe, cookingTime: e.target.value } }))} 
                      required 
                      placeholder="e.g., 30 minutes"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Serves" 
                      name="serves" 
                      value={newFeed.recipe.serves} 
                      onChange={(e) => setNewFeed(prev => ({ ...prev, recipe: { ...prev.recipe, serves: e.target.value } }))} 
                      required 
                      placeholder="e.g., 4 people"
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
                      <select
                        value={newFeed.recipe.difficulty || 'Medium'}
                        onChange={(e) => setNewFeed(prev => ({ ...prev, recipe: { ...prev.recipe, difficulty: e.target.value } }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ingredients <span className="text-red-500">*</span></label>
                    <textarea
                      value={newFeed.recipe.ingredients}
                      onChange={(e) => setNewFeed(prev => ({ ...prev, recipe: { ...prev.recipe, ingredients: e.target.value } }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="List all ingredients with quantities..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions <span className="text-red-500">*</span></label>
                    <textarea
                      value={newFeed.recipe.instructions}
                      onChange={(e) => setNewFeed(prev => ({ ...prev, recipe: { ...prev.recipe, instructions: e.target.value } }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="Write step-by-step cooking instructions..."
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!newFeed.content.trim() || (newFeed.type === 'recipe' && (!newFeed.recipe.name || !newFeed.recipe.ingredients || !newFeed.recipe.instructions))}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Feed
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowCreateFeed(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
};

export default ChefDashboard;