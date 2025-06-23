import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload, Star, Clock, Users, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Banner from '../../components/ui/Banner';
import imagePathService from '../../services/imageLocation/imagePath'; 

const ChefDashboard = () => {
  const { user } = useAuth();
  const [foodItems, setFoodItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
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

  useEffect(() => {
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
    loadFoodItems();
  }, []);

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

  const stats = {
    totalItems: foodItems.length,
    availableItems: foodItems.filter(item => item.available).length,
    totalOrders: foodItems.reduce((sum, item) => sum + item.orders, 0),
    avgRating: foodItems.length > 0 ? (foodItems.reduce((sum, item) => sum + item.rating, 0) / foodItems.length).toFixed(1) : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {banner.show && (
        <Banner type={banner.type} message={banner.message} onClose={() => setBanner({ show: false, type: '', message: '' })} />
      )}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chef Dashboard 👨‍🍳</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}! Manage your delicious offerings</p>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add New Item</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6" hover>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
              <p className="text-gray-600 text-sm">Total Items</p>
            </div>
          </Card>
          <Card className="p-6" hover>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">{stats.availableItems}</p>
              <p className="text-gray-600 text-sm">Available Items</p>
            </div>
          </Card>
          <Card className="p-6" hover>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-gray-600 text-sm">Total Orders</p>
            </div>
          </Card>
          <Card className="p-6" hover>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">{stats.avgRating}</p>
              <p className="text-gray-600 text-sm">Average Rating</p>
            </div>
          </Card>
        </div>
        {(showAddForm || editingItem) && (
          <Card className="p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{editingItem ? 'Edit Food Item' : 'Add New Food Item'}</h2>
              <button onClick={editingItem ? handleCancelEdit : handleCancelAdd} className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-6" encType="multipart/form-data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Item Name *" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter item name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your delicious dish..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input label="Original Price (₹) *" name="originalPrice" type="number" value={formData.originalPrice} onChange={handleInputChange} placeholder="0" min="0" step="0.01" required />
                <Input label="Preparation Time" name="preparationTime" value={formData.preparationTime} onChange={handleInputChange} placeholder="e.g., 25-30 min" />
                <Input label="Discount Percentage (%)" name="discountPercentage" type="number" value={formData.discountPercentage} onChange={handleInputChange} placeholder="0-100" min="0" max="100" step="0.01" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                  <div className="flex items-center space-x-4">
                    <label htmlFor="image" className="cursor-pointer bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-600 transition-colors duration-200">
                      <Upload className="w-5 h-5" />
                      <span>Choose File</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <Input
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., Spicy, Hot, Vegan"
                />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="available" name="available" checked={formData.available} onChange={handleInputChange} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label htmlFor="available" className="ml-2 block text-sm text-gray-700">Available for orders</label>
              </div>
              <div className="flex space-x-4">
                <Button type="submit" className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
                </Button>
                <Button type="button" variant="outline" onClick={editingItem ? handleCancelEdit : handleCancelAdd}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {foodItems.map((item) => (
            <Card key={item.id} className="overflow-hidden" hover>
              <div className="relative">
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                <div className="absolute top-4 left-4">
                  <Badge variant={item.available ? 'success' : 'error'}>{item.available ? 'Available' : 'Unavailable'}</Badge>
                </div>
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button onClick={() => handleEditItem(item)} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200">
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{item.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-700">{item.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{item.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{item.preparationTime}</span>
                  </div>
                  <div className="flex space-x-2">
                    {item.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
                      {item.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">₹{item.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{item.orders} orders</p>
                  </div>
                  <Button size="sm" variant={item.available ? 'outline' : 'primary'} onClick={() => toggleAvailability(item.id)}>
                    {item.available ? 'Mark Unavailable' : 'Mark Available'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {foodItems.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No food items yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first delicious dish!</p>
            <Button onClick={() => setShowAddForm(true)}>Add Your First Item</Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChefDashboard;