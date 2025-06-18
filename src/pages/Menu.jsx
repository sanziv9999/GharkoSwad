import React, { useState } from 'react';
import { Search, Filter, Star, Plus, Heart, Clock, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Items', count: 24 },
    { id: 'main', name: 'Main Dishes', count: 12 },
    { id: 'breakfast', name: 'Breakfast', count: 6 },
    { id: 'dessert', name: 'Desserts', count: 4 },
    { id: 'beverages', name: 'Beverages', count: 8 },
  ];

  const menuItems = [
    {
      id: 1,
      name: 'Traditional Dal Bhat',
      description: 'Authentic Nepali dal bhat with seasonal vegetables, pickles, and papad served with love',
      price: 180,
      originalPrice: 220,
      rating: 4.8,
      reviews: 245,
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'main',
      tags: ['Popular', 'Vegetarian', 'Healthy'],
      cookingTime: '25-30 min',
      serves: '1-2 people',
      chef: 'Ama Didi Kitchen',
      isPopular: true,
      discount: 18
    },
    {
      id: 2,
      name: 'Momo Platter Special',
      description: 'Hand-made steamed dumplings served with spicy tomato chutney and soup',
      price: 120,
      originalPrice: 150,
      rating: 4.9,
      reviews: 189,
      image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'main',
      tags: ['Bestseller', 'Spicy'],
      cookingTime: '20-25 min',
      serves: '1 person',
      chef: 'Newari Kitchen',
      isPopular: true,
      discount: 20
    },
    {
      id: 3,
      name: 'Newari Khaja Set',
      description: 'Traditional Newari snack platter with various authentic delicacies and chutneys',
      price: 250,
      rating: 4.7,
      reviews: 156,
      image: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'main',
      tags: ['Traditional', 'Premium'],
      cookingTime: '35-40 min',
      serves: '2-3 people',
      chef: 'Heritage Kitchen',
      isPopular: false,
      discount: 0
    },
    {
      id: 4,
      name: 'Sel Roti with Gundruk',
      description: 'Traditional ring-shaped rice bread served with fermented leafy greens',
      price: 60,
      originalPrice: 80,
      rating: 4.6,
      reviews: 98,
      image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'breakfast',
      tags: ['Traditional', 'Light'],
      cookingTime: '15-20 min',
      serves: '1 person',
      chef: 'Village Kitchen',
      isPopular: false,
      discount: 25
    },
    {
      id: 5,
      name: 'Yomari Delight',
      description: 'Sweet steamed dumplings filled with molasses, sesame seeds, and coconut',
      price: 80,
      rating: 4.5,
      reviews: 67,
      image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'dessert',
      tags: ['Sweet', 'Festival Special'],
      cookingTime: '20-25 min',
      serves: '1 person',
      chef: 'Sweet Home',
      isPopular: false,
      discount: 0
    },
    {
      id: 6,
      name: 'Authentic Masala Chai',
      description: 'Aromatic spiced tea brewed with fresh herbs, ginger, and cardamom',
      price: 40,
      originalPrice: 50,
      rating: 4.8,
      reviews: 234,
      image: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'beverages',
      tags: ['Hot', 'Refreshing'],
      cookingTime: '5-10 min',
      serves: '1 person',
      chef: 'Chai Corner',
      isPopular: true,
      discount: 20
    }
  ];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Our Menu</h1>
              <p className="text-xl text-gray-600">Discover authentic homemade dishes crafted with love</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Badge variant="success">
                🔥 {menuItems.length} Fresh Items Available
              </Badge>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
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

          {/* Categories */}
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

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group" hover>
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {item.isPopular && (
                    <Badge variant="success">
                      🔥 Popular
                    </Badge>
                  )}
                  {item.discount > 0 && (
                    <Badge variant="error" className="bg-red-500 text-white">
                      {item.discount}% OFF
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
                    <p className="text-sm text-gray-600">by {item.chef}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-700">{item.rating}</span>
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
                    <span>{item.cookingTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{item.serves}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">₹{item.price}</span>
                      {item.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">₹{item.originalPrice}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">({item.reviews} reviews)</p>
                  </div>
                  <Button className="flex items-center space-x-2 px-6">
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