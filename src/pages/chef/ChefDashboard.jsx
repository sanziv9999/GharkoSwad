import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload, Star, Clock, Users, DollarSign, ShoppingBag, ChefHat, LogOut, User, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Banner from '../../components/ui/Banner';
import imagePathService from '../../services/imageLocation/imagePath'; 

const ChefDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'orders'
  const [foodItems, setFoodItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL'); // Order status filter
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    originalPrice: '',
    available: true,
    image: null,
    preparationTime: '',
    tags: '', // String input for tags
    discountPercentage: ''
  });
  const [imagePreview, setImagePreview] = useState(null); // State for image preview
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Distance calculation functions
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const formatDistance = (distance) => {
    return `${distance.toFixed(2)} km`;
  };

  const calculateEstimatedTime = (distance) => {
    // Average delivery speed: 25 km/h (considering traffic, stops, navigation, etc.)
    const averageSpeed = 25;
    const timeInHours = distance / averageSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);
    
    // Add buffer time for very short distances (pickup, parking, etc.)
    const bufferTime = distance < 1 ? 5 : Math.min(10, Math.round(distance));
    const totalMinutes = timeInMinutes + bufferTime;
    
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  const parseCoordinates = (coordString) => {
    try {
      const coords = JSON.parse(coordString);
      return { lat: coords[0], lng: coords[1] };
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  };

  const getDistanceToDelivery = (deliveryCoordinates) => {
    if (!currentLocation) {
      return { text: 'Getting location...', distance: null };
    }
    
    if (!deliveryCoordinates) {
      return { text: 'Unknown', distance: null };
    }
    
    const deliveryCoords = parseCoordinates(deliveryCoordinates);
    if (!deliveryCoords) {
      return { text: 'Invalid coords', distance: null };
    }

    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      deliveryCoords.lat,
      deliveryCoords.lng
    );

    const formattedDistance = formatDistance(distance);
    const estimatedTime = calculateEstimatedTime(distance);

    return {
      text: `${formattedDistance} • Est. ${estimatedTime}`,
      distance: distance
    };
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          showBanner('error', 'Could not get your location for distance calculation');
        }
      );
    } else {
      showBanner('error', 'Geolocation is not supported by this browser');
    }
  };

  // Order filtering functions
  const getOrdersByStatus = (status) => {
    if (status === 'ALL') return orders;
    return orders.filter(order => order.status === status);
  };

  const getOrderCounts = () => {
    const counts = {
      ALL: orders.length,
      PLACED: 0,
      CONFIRMED: 0,
      PREPARING: 0,
      READY: 0,
      CANCELLED: 0
    };
    
    orders.forEach(order => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status]++;
      }
    });
    
    return counts;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ALL': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'PLACED': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PREPARING': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'READY': return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  useEffect(() => {
    // Get current location for distance calculations
    getCurrentLocation();
    
    const loadFoodItems = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
          showBanner('error', 'User ID not found in localStorage');
          return;
        }
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
          tags: item.tags || [], // Backend returns tags as array
          discountPercentage: item.discountPercentage || 0,
          rating: 0,
          orders: 0
        })));
      } catch (error) {
        showBanner('error', `Failed to load food items: ${error.message}`);
      }
    };

    const loadOrders = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
          showBanner('error', 'Chef ID not found in localStorage');
          return;
        }
        const chefId = userData.id;
        const result = await apiService.getOrdersByChefId(chefId);
        if (result && result.data) {
          setOrders(result.data);
        }
      } catch (error) {
        showBanner('error', `Failed to load orders: ${error.message}`);
      }
    };

    loadFoodItems();
    loadOrders();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.profile-dropdown-parent')) {
        setShowProfileDropdown(false);
      }
    }
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 4000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      originalPrice: '',
      available: true,
      image: null,
      preparationTime: '',
      tags: '', // Reset to empty string
      discountPercentage: ''
    });
    setImagePreview(null); // Reset image preview
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
    if (type === 'file' && files && files[0]) {
      const objectUrl = URL.createObjectURL(files[0]);
      setImagePreview(objectUrl);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.originalPrice) {
      showBanner('error', 'Please fill in all required fields');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || !userData.id) {
      showBanner('error', 'User ID not found in localStorage');
      return;
    }
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('originalPrice', formData.originalPrice);
    formDataToSend.append('available', formData.available.toString());
    if (formData.preparationTime) formDataToSend.append('preparationTime', formData.preparationTime);
    if (formData.tags) {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      formDataToSend.append('tags', tagsArray.join(',')); // Send as comma-separated string
    }
    if (formData.discountPercentage) formDataToSend.append('discountPercentage', formData.discountPercentage);
    if (formData.image) formDataToSend.append('image', formData.image);
    formDataToSend.append('userId', userData.id);
    try {
      const result = await apiService.addFood(formDataToSend);
      setFoodItems(prev => [...prev, { ...result.data, rating: 0, orders: 0 }]);
      resetForm();
      setShowAddForm(false);
      showBanner('success', `${formData.name} has been added successfully!`);
      const updatedItems = await apiService.getFoodsById(userData.id);
      setFoodItems(updatedItems.map(item => ({
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
        rating: 0,
        orders: 0
      })));
    } catch (error) {
      showBanner('error', `Failed to add item: ${error.message}`);
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
      tags: item.tags ? item.tags.join(', ') : '', // Display tags as comma-separated string
      discountPercentage: item.discountPercentage ? item.discountPercentage.toString() : ''
    });
    setImagePreview(item.image);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.originalPrice) {
      showBanner('error', 'Please fill in all required fields');
      return;
    }
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('originalPrice', formData.originalPrice);
    formDataToSend.append('available', formData.available.toString());
    if (formData.preparationTime) formDataToSend.append('preparationTime', formData.preparationTime);
    if (formData.tags) {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      formDataToSend.append('tags', tagsArray.join(',')); // Send as comma-separated string
    }
    if (formData.discountPercentage) formDataToSend.append('discountPercentage', formData.discountPercentage);
    if (formData.image) formDataToSend.append('image', formData.image);
    try {
      const result = await apiService.updateFood(editingItem, formDataToSend);
      setFoodItems(prev => prev.map(item => item.id === editingItem ? { ...result.data, id: item.id } : item));
      const updatedItemName = foodItems.find(item => item.id === editingItem)?.name;
      setEditingItem(null);
      resetForm();
      showBanner('success', `${updatedItemName} has been updated successfully!`);
      const userData = JSON.parse(localStorage.getItem('user'));
      const updatedItems = await apiService.getFoodsById(userData.id);
      setFoodItems(updatedItems.map(item => ({
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
        rating: 0,
        orders: 0
      })));
    } catch (error) {
      showBanner('error', `Failed to update item: ${error.message}`);
    }
  };

  const handleDeleteItem = async (id) => {
    const itemToDelete = foodItems.find(item => item.id === id);
    if (window.confirm(`Are you sure you want to delete "${itemToDelete.name}"?`)) {
      try {
        await apiService.deleteFood(id);
        setFoodItems(prev => prev.filter(item => item.id !== id));
        showBanner('success', `${itemToDelete.name} has been deleted successfully!`);
        const userData = JSON.parse(localStorage.getItem('user'));
        const updatedItems = await apiService.getFoodsById(userData.id);
        setFoodItems(updatedItems.map(item => ({
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
          rating: 0,
          orders: 0
        })));
      } catch (error) {
        showBanner('error', `Failed to delete item: ${error.message}`);
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

  const toggleAvailability = async (id) => {
    const item = foodItems.find(item => item.id === id);
    const newAvailability = !item.available;
    const formDataToSend = new FormData();
    formDataToSend.append('available', newAvailability.toString());
    try {
      const result = await apiService.updateFood(id, formDataToSend);
      setFoodItems(prev => prev.map(item => item.id === id ? { ...result.data, id: item.id } : item));
      const status = newAvailability ? 'available' : 'unavailable';
      showBanner('info', `${item.name} is now ${status}`);
      const userData = JSON.parse(localStorage.getItem('user'));
      const updatedItems = await apiService.getFoodsById(userData.id);
      setFoodItems(updatedItems.map(item => ({
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
        rating: 0,
        orders: 0
      })));
    } catch (error) {
      showBanner('error', `Failed to update availability: ${error.message}`);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) {
        showBanner('error', 'Chef ID not found in localStorage');
        return;
      }
      const chefId = userData.id; // Use chef's ID from localStorage
      
      const result = await apiService.updateOrderStatus(orderId, newStatus, chefId);
      if (result && result.data) {
        // Update the orders state
        setOrders(prev => prev.map(order => 
          order.orderId === orderId ? { ...order, status: newStatus } : order
        ));
        showBanner('success', `Order #${orderId} status updated to ${newStatus}`);
      }
    } catch (error) {
      showBanner('error', `Failed to update order status: ${error.message}`);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PLACED': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'PREPARING': return 'primary';
      case 'READY': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getOrderProgress = (status) => {
    const statusMap = {
      'PLACED': 25,
      'CONFIRMED': 50,
      'PREPARING': 75,
      'READY': 100,
      'CANCELLED': 0
    };
    return statusMap[status] || 0;
  };

  const getProgressColor = (status) => {
    const colorMap = {
      'PLACED': 'bg-yellow-500',
      'CONFIRMED': 'bg-blue-500',
      'PREPARING': 'bg-purple-500',
      'READY': 'bg-green-500',
      'CANCELLED': 'bg-red-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  const stats = {
    totalItems: foodItems.length,
    availableItems: foodItems.filter(item => item.available).length,
    totalOrders: orders.length,
    activeOrders: orders.filter(order => ['PLACED', 'CONFIRMED', 'PREPARING'].includes(order.status)).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {banner.show && (
        <Banner type={banner.type} message={banner.message} onClose={() => setBanner({ show: false, type: '', message: '' })} />
      )}
      
      {/* Modern Professional Header with Responsive Layout */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row items-center md:items-stretch justify-between gap-4 md:gap-6 w-full">
            {/* Logo Card */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30 flex items-center min-w-[180px] max-w-full shadow-md w-full md:w-auto justify-center md:justify-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl sm:text-2xl font-bold text-white">GharkoSwad</h1>
                <p className="text-emerald-100 text-xs sm:text-sm font-medium">Professional Kitchen</p>
              </div>
            </div>
            {/* User Avatar Dropdown */}
            <div className="relative w-full md:w-auto flex justify-center md:justify-end profile-dropdown-parent mt-2 md:mt-0">
              <button
                onClick={() => setShowProfileDropdown((prev) => !prev)}
                className="focus:outline-none"
                aria-label="Open profile menu"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-white/40 shadow-md hover:ring-2 hover:ring-emerald-400 transition">
                  <User className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                </div>
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 md:right-0 top-14 md:top-auto md:mt-3 w-64 bg-white rounded-xl shadow-2xl border border-emerald-100 z-50 p-5 animate-fade-in">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold text-base">{user?.username || 'Chef'}</div>
                      <div className="text-emerald-700 text-xs">{user?.role || ''}</div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-gray-700 text-sm font-medium">{user?.email || ''}</div>
                    {user?.address && (
                      <div className="text-gray-500 text-xs mt-1">{user.address}</div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Add New Dish Button in Body */}
        {activeTab === 'menu' && (
          <div className="flex flex-col sm:flex-row justify-end items-center mb-8 gap-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-6 py-3 flex items-center justify-center space-x-2 shadow-lg transition-all text-base"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Dish</span>
            </button>
          </div>
        )}

        {/* Add/Edit Dish Modal Overlay */}
        {(showAddForm || editingItem) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-w-lg mx-2 sm:mx-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-10 animate-fade-in overflow-y-auto max-h-[90vh]">
              <button
                onClick={editingItem ? handleCancelEdit : handleCancelAdd}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-xl hover:bg-red-50 border border-gray-200 hover:border-red-200 z-10"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  {editingItem ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
                </h2>
              </div>
              <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-6" encType="multipart/form-data">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Item Name *" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter dish name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your dish..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Original Price (₹) *" name="originalPrice" type="number" value={formData.originalPrice} onChange={handleInputChange} placeholder="0.00" min="0" step="0.01" required />
                  <Input label="Preparation Time" name="preparationTime" value={formData.preparationTime} onChange={handleInputChange} placeholder="e.g., 25-30 min" />
                  <Input label="Discount (%)" name="discountPercentage" type="number" value={formData.discountPercentage} onChange={handleInputChange} placeholder="0-100" min="0" max="100" step="0.01" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Food Image</label>
                    <div className="flex items-center space-x-4">
                      <label htmlFor="image" className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors duration-200">
                        <Upload className="w-4 h-4" />
                        <span>Choose Image</span>
                      </label>
                      <input
                        id="image"
                        name="image"
                        type="file"
                        onChange={handleInputChange}
                        className="hidden"
                        accept="image/*"
                      />
                      {formData.image && (
                        <span className="text-sm text-gray-600">{formData.image.name}</span>
                      )}
                    </div>
                  </div>
                  {imagePreview && (
                    <div className="flex items-center">
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <Input
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., Spicy, Vegetarian, Popular"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    name="available"
                    checked={formData.available}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-700">Available for orders</label>
                </div>
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={editingItem ? handleCancelEdit : handleCancelAdd}
                    className="bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Items Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ChefHat className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{stats.totalItems}</p>
                    <p className="text-gray-600 text-sm font-medium">Total Items</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Available Items Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">{stats.availableItems}</p>
                    <p className="text-gray-600 text-sm font-medium">Available</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Orders Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ShoppingBag className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">{stats.totalOrders}</p>
                    <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Orders Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.activeOrders}</p>
                    <p className="text-gray-600 text-sm font-medium">Active Orders</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Content */}
        {activeTab === 'menu' && (
          <>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foodItems.map((item) => (
                <Card key={item.id} className="overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow" hover>
                  <div className="relative">
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge 
                        className={`${item.available ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} text-xs font-medium`}
                      >
                        {item.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3 flex space-x-2">
                      <button 
                        onClick={() => handleEditItem(item)} 
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)} 
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-600">{item.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 text-sm">{item.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.preparationTime}</span>
                      </div>
                      <div className="flex space-x-1">
                        {item.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} className="text-xs bg-gray-100 text-gray-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
                          {item.originalPrice && item.originalPrice !== item.price && (
                            <span className="text-sm text-gray-500 line-through">₹{item.originalPrice.toFixed(2)}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{item.orders} orders</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => toggleAvailability(item.id)}
                        className={`${item.available 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                        } border-0 font-medium`}
                      >
                        {item.available ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {foodItems.length === 0 && (
              <Card className="p-12 text-center bg-white border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No menu items yet</h3>
                <p className="text-gray-600 mb-6">Start by adding your first delicious dish!</p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Add Your First Dish
                </Button>
              </Card>
            )}
          </>
        )}

        {/* Orders Content */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Clean Order Status Filters */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Order Management</h3>
                <div className="text-sm text-gray-500">
                  Total: {orders.length} orders
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'CANCELLED'].map((status) => {
                  const counts = getOrderCounts();
                  const count = counts[status] || 0;
                  const isActive = orderStatusFilter === status;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`relative p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                        isActive 
                          ? getStatusBadgeColor(status) + ' shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-xs font-medium uppercase tracking-wide">{status}</div>
                      <div className="text-lg font-bold mt-1">{count}</div>
                      {count > 0 && isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Distance Info */}
            {orders.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <span className="font-medium">📍 Distance estimates:</span> 
                  Based on 25 km/h avg speed including traffic and stops.
                </p>
              </div>
            )}

            {/* Orders Display */}
            {(() => {
              const filteredOrders = getOrdersByStatus(orderStatusFilter);
              
              if (filteredOrders.length > 0) {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-700">
                        {orderStatusFilter === 'ALL' ? 'All Orders' : `${orderStatusFilter} Orders`} 
                        <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">({filteredOrders.length})</span>
                      </h4>
                    </div>
                    
                    {filteredOrders.map((order) => (
                <Card key={order.orderId} className="overflow-hidden bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  {/* Professional Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-100 p-3 rounded-full">
                          <ShoppingBag className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Order #{order.orderId}</h3>
                          <p className="text-sm text-gray-500">Placed on {formatDate(order.orderDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={`text-sm font-semibold px-3 py-1 ${
                            order.status === 'PLACED' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'PREPARING' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'READY' ? 'bg-green-100 text-green-800' :
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.status}
                        </Badge>
                        {order.status !== 'CANCELLED' && (
                          <div className="flex flex-col items-end">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mb-1">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(order.status)}`}
                                style={{ width: `${getOrderProgress(order.status)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{getOrderProgress(order.status)}% Complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-6 space-y-6">
                    {/* Customer & Delivery Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Customer Information Card */}
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center mb-3">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-blue-900">Customer Information</h4>
                        </div>
                        {(() => {
                          const customerInfo = order.user || 
                            (order.orderItems && order.orderItems.length > 0 && 
                             order.orderItems[0].foodItem && 
                             order.orderItems[0].foodItem.user);
                          
                          return customerInfo ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">NAME</span>
                                  <span className="text-sm font-medium text-gray-900">{customerInfo.username}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">EMAIL</span>
                                  <span className="text-sm text-gray-700">{customerInfo.email}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {customerInfo.phoneNumber && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">PHONE</span>
                                    <span className="text-sm text-gray-700">{customerInfo.phoneNumber}</span>
                                  </div>
                                )}
                                {customerInfo.location && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">ADDRESS</span>
                                    <span className="text-sm text-gray-700">{customerInfo.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-4">
                              <p className="text-sm text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">Customer ID: {order.userId}</p>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Delivery Information Card */}
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                        <div className="flex items-center mb-3">
                          <div className="bg-orange-100 p-2 rounded-lg mr-3">
                            <MapPin className="w-5 h-5 text-orange-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-orange-900">Delivery Details</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">LOCATION</span>
                            <span className="text-sm font-medium text-gray-900">{order.deliveryLocation}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">CONTACT</span>
                            <span className="text-sm text-gray-700">{order.deliveryPhone}</span>
                          </div>
                          {order.deliveryCoordinates && (() => {
                            const deliveryInfo = getDistanceToDelivery(order.deliveryCoordinates);
                            const isClose = deliveryInfo.distance && deliveryInfo.distance < 2;
                            const isFar = deliveryInfo.distance && deliveryInfo.distance > 10;
                            
                            return (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">DISTANCE</span>
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                  isClose ? 'bg-green-100 text-green-800' :
                                  isFar ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {deliveryInfo.text}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Order Management Actions
                      </div>
                      <div className="flex items-center space-x-3">
                        {order.status === 'PLACED' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.orderId, 'CONFIRMED')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Confirm
                          </Button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.orderId, 'PREPARING')}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'PREPARING' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.orderId, 'READY')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Mark Ready
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Information */}
                  {(order.amount || order.paymentMethod || order.paymentStatus) && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {order.amount && (
                          <div className="text-center">
                            <span className="block text-2xl font-bold text-gray-900">₹{order.amount.toFixed(2)}</span>
                            <span className="text-sm text-gray-600">Total Amount</span>
                          </div>
                        )}
                        {order.paymentMethod && (
                          <div className="text-center">
                            <span className="block text-lg font-semibold text-gray-900">{order.paymentMethod}</span>
                            <span className="text-sm text-gray-600">Payment Method</span>
                          </div>
                        )}
                        {order.paymentStatus && (
                          <div className="text-center">
                            <Badge 
                              className={`text-sm ${
                                order.paymentStatus === 'COMPLETED' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {order.paymentStatus}
                            </Badge>
                            <span className="block text-sm text-gray-600 mt-1">Payment Status</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Premium Order Items Section */}
                  <div className="relative mt-6">
                    <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-lg">
                      
                      {/* Professional Header */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-200">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                              <ShoppingBag className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{order.orderItems.length}</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                              Order Items
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''} in this order
                            </p>
                          </div>
                        </div>
                        
                        {/* Order Summary Badge */}
                        <div className="bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200 px-4 py-2 rounded-xl">
                          <div className="text-center">
                            <span className="text-xs font-medium text-emerald-700">Total Value</span>
                            <p className="text-lg font-bold text-emerald-800">
                              ₹{order.orderItems.reduce((total, item) => total + (item.foodItem.price * item.quantity), 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Compact Items Grid */}
                      <div className="space-y-4">
                        {order.orderItems.map((item, index) => (
                          <div key={item.orderItemId} className="group relative">
                            {/* Main Card */}
                            <div className="bg-white rounded-xl border border-gray-200 group-hover:border-emerald-200 shadow-sm group-hover:shadow-md transition-all duration-300">
                              <div className="p-4">
                                <div className="grid grid-cols-12 gap-4 items-start">
                                  
                                  {/* Image Section - 2 columns */}
                                  <div className="col-span-12 md:col-span-2">
                                    <div className="relative">
                                      <div className="aspect-square rounded-xl overflow-hidden shadow-sm">
                                        <img 
                                          src={imagePathService.getImageUrl(item.foodItem.imagePath)} 
                                          alt={item.foodItem.name} 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg flex items-center justify-center shadow-md">
                                        <span className="text-xs font-bold">{index + 1}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Content Section - 7 columns */}
                                  <div className="col-span-12 md:col-span-7 space-y-3">
                                    {/* Title & Description */}
                                    <div>
                                      <h5 className="text-lg font-bold text-gray-900 mb-2">
                                        {item.foodItem.name}
                                      </h5>
                                      <p className="text-gray-600 text-sm leading-relaxed">
                                        {item.foodItem.description}
                                      </p>
                                    </div>
                                    
                                    {/* Compact Info Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white font-bold text-xs">QTY</span>
                                          </div>
                                          <div>
                                            <span className="text-lg font-bold text-blue-900">{item.quantity}</span>
                                            <p className="text-xs text-blue-600">items</p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 border border-orange-100">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-white" />
                                          </div>
                                          <div>
                                            <span className="text-sm font-bold text-orange-900">{item.foodItem.preparationTime}</span>
                                            <p className="text-xs text-orange-600">prep time</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Compact Tags */}
                                    {item.foodItem.tags && item.foodItem.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {item.foodItem.tags.map((tag, tagIndex) => (
                                          <span 
                                            key={tagIndex} 
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200"
                                          >
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1.5"></div>
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Pricing Section - 3 columns */}
                                  <div className="col-span-12 md:col-span-3">
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100 shadow-sm">
                                      <div className="text-center space-y-3">
                                        <div>
                                          <p className="text-xs font-medium text-emerald-700 mb-1">Unit Price</p>
                                          <div className="flex items-center justify-center space-x-1">
                                            <span className="text-xl font-bold text-emerald-700">₹{item.foodItem.price.toFixed(2)}</span>
                                            {item.foodItem.originalPrice && item.foodItem.originalPrice !== item.foodItem.price && (
                                              <span className="text-xs text-gray-500 line-through">₹{item.foodItem.originalPrice.toFixed(2)}</span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="border-t border-emerald-200 pt-3">
                                          <p className="text-xs font-medium text-gray-700 mb-2">Item Total</p>
                                          <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg py-2 px-3 shadow-md">
                                            <span className="text-lg font-bold">
                                              ₹{(item.foodItem.price * item.quantity).toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
                  </div>
                );
              } else {
                return (
                  <Card className="p-12 text-center bg-white border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {orderStatusFilter === 'ALL' ? 'No orders yet' : `No ${orderStatusFilter.toLowerCase()} orders`}
                    </h3>
                    <p className="text-gray-600">
                      {orderStatusFilter === 'ALL' 
                        ? 'Orders will appear here when customers place them!' 
                        : `No orders with status "${orderStatusFilter}" found.`
                      }
                    </p>
                  </Card>
                );
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefDashboard;