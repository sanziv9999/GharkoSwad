import React, { useState } from 'react';
import { MapPin, Filter, Star, Clock, Phone, Award, Truck } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Stores = () => {
  const [selectedLocation, setSelectedLocation] = useState('Kathmandu');
  const [sortBy, setSortBy] = useState('relevance');

  const locations = [
    { name: 'Kathmandu', count: 24 },
    { name: 'Bhaktapur', count: 12 },
    { name: 'Lalitpur', count: 18 },
    { name: 'Pokhara', count: 8 }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'delivery-time', label: 'Fastest Delivery' },
    { value: 'cost', label: 'Cost: Low to High' },
  ];

  const stores = [
    {
      id: 1,
      name: 'Ama Le Banako Khanikura',
      description: 'The top choice among all our customers, delicious, healthy and a part of an amazing breakfast experience with traditional recipes.',
      cuisine: 'Nepali Traditional',
      rating: 4.8,
      reviews: 245,
      deliveryTime: '25-35 min',
      deliveryFee: 'FREE',
      location: 'Hattiban, Lalitpur',
      phone: '+977-9841234567',
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500',
      tags: ['Available', 'Verified', 'Top Rated'],
      isAvailable: true,
      isVerified: true,
      specialties: ['Dal Bhat', 'Gundruk', 'Achaar'],
      minOrder: 150,
      discount: 20
    },
    {
      id: 2,
      name: 'Pure veg and organic Foods',
      description: 'Committed to serving the freshest organic vegetables and healthy meals prepared with love and traditional cooking methods.',
      cuisine: 'Organic Vegetarian',
      rating: 4.9,
      reviews: 189,
      deliveryTime: '20-30 min',
      deliveryFee: '₹25',
      location: 'Thaiba, Kathmandu',
      phone: '+977-9841234568',
      image: 'https://images.pexels.com/photos/1833336/pexels-photo-1833336.jpeg?auto=compress&cs=tinysrgb&w=500',
      tags: ['Available', 'Organic', 'Healthy'],
      isAvailable: true,
      isVerified: true,
      specialties: ['Organic Salads', 'Green Smoothies', 'Quinoa Bowls'],
      minOrder: 200,
      discount: 15
    },
    {
      id: 3,
      name: 'Baje le banako Homemade Food',
      description: 'Traditional homestyle cooking by experienced grandmothers who bring decades of culinary wisdom to every dish.',
      cuisine: 'Traditional Homestyle',
      rating: 4.7,
      reviews: 156,
      deliveryTime: '30-40 min',
      deliveryFee: 'FREE',
      location: 'Patan, Lalitpur',
      phone: '+977-9841234569',
      image: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=500',
      tags: ['Available', 'Family Recipe', 'Traditional'],
      isAvailable: true,
      isVerified: false,
      specialties: ['Home Curry', 'Roti', 'Pickle'],
      minOrder: 120,
      discount: 10
    },
    {
      id: 4,
      name: 'Newari Kitchen Specialty',
      description: 'Authentic Newari cuisine prepared by experienced traditional cooks with organic ingredients and time-honored recipes.',
      cuisine: 'Newari Traditional',
      rating: 4.6,
      reviews: 198,
      deliveryTime: '35-45 min',
      deliveryFee: '₹30',
      location: 'Bhaktapur',
      phone: '+977-9841234570',
      image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=500',
      tags: ['Available', 'Spicy', 'Heritage'],
      isAvailable: true,
      isVerified: true,
      specialties: ['Momo', 'Newari Khaja', 'Chatamari'],
      minOrder: 180,
      discount: 25
    },
    {
      id: 5,
      name: 'Mountain Home Cooking',
      description: 'Hearty mountain-style dishes prepared with fresh local ingredients and traditional cooking methods from the hills.',
      cuisine: 'Mountain Traditional',
      rating: 4.5,
      reviews: 87,
      deliveryTime: '40-50 min',
      deliveryFee: 'FREE',
      location: 'Thaiba, Kathmandu',
      phone: '+977-9841234571',
      image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=500',
      tags: ['Available', 'Mountain Style', 'Healthy'],
      isAvailable: true,
      isVerified: false,
      specialties: ['Sel Roti', 'Gundruk Soup', 'Dhido'],
      minOrder: 100,
      discount: 0
    },
    {
      id: 6,
      name: 'Village Style Kitchen',
      description: 'Simple yet delicious village-style cooking that brings back childhood memories of home with authentic flavors.',
      cuisine: 'Village Traditional',
      rating: 4.4,
      reviews: 123,
      deliveryTime: '25-35 min',
      deliveryFee: '₹20',
      location: 'Patan, Lalitpur',
      phone: '+977-9841234572',
      image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=500',
      tags: ['Available', 'Comfort Food', 'Village Style'],
      isAvailable: true,
      isVerified: true,
      specialties: ['Village Curry', 'Fermented Foods', 'Seasonal Items'],
      minOrder: 80,
      discount: 5
    }
  ];

  const filteredStores = stores.filter(store => 
    selectedLocation === 'All' || store.location.includes(selectedLocation)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            Homes and <span className="text-primary-500">Stores</span>
          </h1>
          <p className="text-xl text-gray-600">
            Discover authentic homemade food from verified local kitchens
          </p>
        </div>

        {/* Location and Filters */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Location Filter */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-6 h-6 text-primary-500" />
                <span className="text-lg font-bold text-gray-900">Location</span>
              </div>
              <div className="space-y-2">
                {locations.map((location) => (
                  <button
                    key={location.name}
                    onClick={() => setSelectedLocation(location.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                      selectedLocation === location.name
                        ? 'bg-primary-50 text-primary-600 border border-primary-200'
                        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <span className="font-medium">{location.name}</span>
                    <Badge variant="primary" size="sm">
                      {location.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card>

            {/* Sort Options */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Card>

            {/* Filters */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Time
                  </label>
                  <div className="space-y-2">
                    {['Under 30 min', '30-45 min', '45+ min'].map((time) => (
                      <label key={time} className="flex items-center">
                        <input type="checkbox" className="rounded text-primary-500" />
                        <span className="ml-2 text-sm text-gray-600">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="space-y-2">
                    {['4.5+', '4.0+', '3.5+'].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input type="checkbox" className="rounded text-primary-500" />
                        <span className="ml-2 text-sm text-gray-600">{rating} ⭐</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Filter Bar */}
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">More Filters</span>
                </button>
                <p className="text-gray-600">
                  <span className="font-semibold">{filteredStores.length}</span> restaurants found in{' '}
                  <span className="font-semibold">{selectedLocation}</span>
                </p>
              </div>
            </Card>

            {/* Stores Grid */}
            <div className="space-y-6">
              {filteredStores.map((store) => (
                <Card key={store.id} className="overflow-hidden" hover>
                  <div className="md:flex">
                    <div className="md:w-1/3 relative">
                      <img
                        src={store.image}
                        alt={store.name}
                        className="w-full h-64 md:h-full object-cover"
                      />
                      {store.discount > 0 && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="error" className="bg-red-500 text-white">
                            {store.discount}% OFF
                          </Badge>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {store.isVerified && (
                          <Badge variant="success" className="bg-green-500 text-white flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{store.name}</h3>
                          <p className="text-gray-600 font-medium">{store.cuisine}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            <span className="text-lg font-bold text-gray-900">{store.rating}</span>
                          </div>
                          <p className="text-sm text-gray-600">({store.reviews} reviews)</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">{store.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {store.tags.map((tag, index) => (
                          <Badge key={index} variant="primary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {store.specialties.map((specialty, index) => (
                          <span key={index} className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {specialty}
                          </span>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{store.deliveryTime}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{store.deliveryFee}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{store.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Call</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <p>Min Order: <span className="font-semibold">₹{store.minOrder}</span></p>
                        </div>
                        <div className="flex space-x-3">
                          <Button variant="outline" size="md">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                          <Button size="md">
                            View Menu
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stores;