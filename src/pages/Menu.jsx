import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Plus, Heart, Clock, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { apiService } from '../api/apiService'; 
import imagePathService from '../services/imageLocation/imagePath'; 
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // Verify this path

const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAllFoods();
        console.log('API Response:', response);
        const items = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response)
          ? response
          : [];
        const itemsWithIds = items.map((item) => {
          if (!item.id) {
            console.warn('Item missing id:', item);
          } else {
            console.log('Fetched food item ID:', item.id);
          }
          return item;
        });
        setMenuItems(itemsWithIds);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch menu items');
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, []);

  const categories = [
    { id: 'all', name: 'All Items', count: menuItems.length },
    { id: 'main', name: 'Main Dishes', count: menuItems.filter(item => item.category === 'main').length },
    { id: 'breakfast', name: 'Breakfast', count: menuItems.filter(item => item.category === 'breakfast').length },
    { id: 'dessert', name: 'Desserts', count: menuItems.filter(item => item.category === 'dessert').length },
    { id: 'beverages', name: 'Beverages', count: menuItems.filter(item => item.category === 'beverages').length },
  ];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = async (item) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;
      console.log('Adding to cart:', { userId, foodId: item.id, quantity: 1 });
      if (!userId) {
        toast.error('Please log in to add items to cart');
        navigate('/login');
        return;
      }
      await addToCart({ ...item, id: item.id }, 1);
      toast.success(`${item.name} added to cart!`);
    } catch (err) {
      toast.error('Failed to add item to cart');
      console.error('Error adding to cart:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading menu items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Our Menu</h1>
              <p className="text-xl text-gray-600">Discover authentic homemade dishes crafted with love</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="success">
                🔥 {menuItems.length} Fresh Items Available
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-8 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search for delicious dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-6 py-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors duration-200">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">Advanced Filters</span>
              </button>
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md'
                }`}
              >
                {category.name}
                <span className="ml-2 text-sm opacity-75">({category.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group" hover>
              <div className="relative">
                <img
                  src={imagePathService.getImageUrl(item.imagePath || item.image)}
                  alt={item.name}
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {item.isPopular && (
                    <Badge variant="success">
                      🔥 Popular
                    </Badge>
                  )}
                  {item.discountPercentage > 0 && (
                    <Badge variant="error" className="bg-red-500 text-white">
                      {item.discountPercentage}% OFF
                    </Badge>
                  )}
                </div>
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200">
                  <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600">by {item.chef || 'Unknown Chef'}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-700">{item.rating || 0}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="primary" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{item.preparationTime || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{item.serves || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
                      {item.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">₹{item.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{item.reviews || 0} reviews</p>
                  </div>
                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="flex items-center space-x-2 px-6"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Menu;